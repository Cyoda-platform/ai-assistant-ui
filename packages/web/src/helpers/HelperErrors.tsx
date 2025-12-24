import React from 'react';
import ReactDOM from 'react-dom/client';
import { AxiosError } from "axios";
import ErrorModal from '@/components/ErrorModal/ErrorModal';
import GuestLimitModal from '@/components/GuestLimitModal/GuestLimitModal.tsx';
import eventBus from '@/plugins/eventBus';
import { SHOW_LOGIN_POPUP } from '@/helpers/HelperConstants';

interface ErrorResponse {
    response?: {
        status?: number;
        data?: {
            message?: string;
            error?: string;
            errors?: string[] | Record<string, string>;
        };
    };
    message?: string;
}

export default class HelperErrors {
    private static modalContainer: HTMLDivElement | null = null;
    private static modalRoot: any = null;

    private static showModal(message: string, type: 'info' | 'warning' | 'error' | 'network' = 'info') {
        // Check if modal is already open
        const existingModal = document.querySelector('.helper-errors');
        if (existingModal) {
            return;
        }

        // Clean up any existing modal first
        if (this.modalRoot && this.modalContainer) {
            try {
                this.modalRoot.unmount();
                this.modalContainer.remove();
            } catch (e) {
                console.error('Error cleaning up previous modal:', e);
            }
            this.modalContainer = null;
            this.modalRoot = null;
        }

        // Create container
        this.modalContainer = document.createElement('div');
        document.body.appendChild(this.modalContainer);

        // Create root and render modal
        this.modalRoot = ReactDOM.createRoot(this.modalContainer);

        const handleClose = () => {
            if (this.modalRoot && this.modalContainer) {
                try {
                    this.modalRoot.unmount();
                    if (this.modalContainer.parentNode) {
                        this.modalContainer.parentNode.removeChild(this.modalContainer);
                    }
                } catch (e) {
                    console.error('Error closing modal:', e);
                }
                this.modalContainer = null;
                this.modalRoot = null;
            }
        };

        this.modalRoot.render(
            <ErrorModal
                visible={true}
                message={message}
                type={type}
                onClose={handleClose}
            />
        );
    }

    public static handler(data: ErrorResponse | AxiosError): void {
        // Check if modal is already open
        const warningMessage = document.querySelector('.helper-errors');
        if (warningMessage) return;

        if (data.response?.data?.error?.includes('Invalid token')) return;

        if (
            data?.response?.status &&
            [401, 403].includes(data.response.status) &&
            data.response.data?.message &&
            !data.response.data?.message.includes('Invalid username or password')
        ) {
            return;
        }

        if (data?.message === 'canceled') return;

        // Extract error data
        let errorData: any = data;
        if (data?.response?.data) {
            errorData = data.response.data;
        }

        // Check if error has a custom modal configuration
        if (errorData?.modal) {
            this.showCustomModal(errorData.modal);
            return;
        }

        // Handle server errors without message
        if (
            data?.response?.status &&
            data.response.status > 200 &&
            data.response.data &&
            !data.response.data.message &&
            !data.response.data.error
        ) {
            this.showModal(
                `The server returned an unexpected response (Status: ${data.response.status}). Please try again later.`,
                'error'
            );
            return;
        }

        // Handle network errors (including ERR_CONNECTION_REFUSED)
        if (data?.message === 'Network Error' || data?.code === 'ERR_NETWORK' || data?.code === 'ERR_CONNECTION_REFUSED') {
            this.showModal(
                'Unable to connect to the server. Please check that the backend server is running and try again.',
                'network'
            );
            return;
        }

        let message = '';
        let type: 'info' | 'warning' | 'error' = 'info';

        // Determine type based on status code
        if (data?.response?.status) {
            if ([409].includes(data.response.status)) {
                type = 'warning';
            } else if (data.response.status >= 400) {
                type = 'error';
            }
        }

        // Extract message
        if (errorData?.errors && Array.isArray(errorData.errors)) {
            message = errorData.errors.join('\n');
        } else if (errorData?.message) {
            message = errorData.message;
        } else if (errorData?.error) {
            message = errorData.error;
        } else {
            message = 'An unexpected error occurred. Please try again.';
        }

        this.showModal(message, type);
    }

    private static showCustomModal(modalConfig: any): void {
        // Check if modal is already open
        const warningMessage = document.querySelector('.helper-errors');
        if (warningMessage) return;

        // Create container
        this.modalContainer = document.createElement('div');
        document.body.appendChild(this.modalContainer);

        // Create root and render modal
        this.modalRoot = ReactDOM.createRoot(this.modalContainer);

        const handleClose = () => {
            if (this.modalRoot && this.modalContainer) {
                try {
                    this.modalRoot.unmount();
                    if (this.modalContainer.parentNode) {
                        this.modalContainer.parentNode.removeChild(this.modalContainer);
                    }
                } catch (e) {
                    console.error('Error closing modal:', e);
                }
                this.modalContainer = null;
                this.modalRoot = null;
            }
        };

        const handleAction = () => {
            if (modalConfig.action === 'login') {
                // Emit login event
                eventBus.$emit(SHOW_LOGIN_POPUP);
            }
            handleClose();
        };

        this.modalRoot.render(
            <GuestLimitModal
                visible={true}
                title={modalConfig.title}
                message={modalConfig.message}
                description={modalConfig.description}
                actionLabel={modalConfig.action_label}
                onAction={handleAction}
                onClose={handleClose}
            />
        );
    }
}
