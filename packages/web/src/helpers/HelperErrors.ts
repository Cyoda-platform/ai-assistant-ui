import {ElMessageBox, ElNotification} from 'element-plus';
import {AxiosError} from "axios";

interface ErrorResponse {
    response?: {
        status?: number;
        data?: {
            message?: string;
            errors?: Record<string, string>;
        };
    };
    message?: string;
}

export default class HelperErrors {
    public static handler(data: ErrorResponse | AxiosError): void {
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

        if (
            data?.response?.status &&
            data.response.status > 200 &&
            data.response.data &&
            !data.response.data.message &&
            !data.response.data.error
        ) {
            ElMessageBox.alert(
                `Server response status ${data.response.status}`,
                'Server error',
                {
                    dangerouslyUseHTMLString: true,
                    customClass: 'helper-errors',
                }
            );
            return;
        }

        if (data?.message === 'Network Error') {
            ElMessageBox.alert(
                'Please check your network configurations',
                'Network Error',
                {
                    dangerouslyUseHTMLString: true,
                    customClass: 'helper-errors',
                }
            );
            return;
        }

        if (data?.response?.data) {
            data = data.response.data;
        }

        let title = 'Error!';
        let content = '';

        if ([409].includes(data?.response?.status)) {
            title = 'Notification!'
        }

        if (data?.errors && Array.isArray(data.errors)) {
            const errorsArr: string[] = data.errors.map(
                (error: string, index: number) => `${index + 1}) ${error}`
            );
            content = errorsArr.join('<br/>');
        } else if (data?.message) {
            content = data.message;
        } else if (data?.error) {
            content = data.error;
        }

        ElMessageBox.alert(content, title, {
            dangerouslyUseHTMLString: true,
            customClass: 'helper-errors',
        });
    }
}
