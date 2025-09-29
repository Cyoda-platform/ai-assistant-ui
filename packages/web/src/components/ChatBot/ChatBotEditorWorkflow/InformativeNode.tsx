import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { PlayCircle, StopCircle, Circle, ArrowRight, Lock, Unlock } from 'lucide-react';
import { workflowTheme } from './workflowTheme';

interface InformativeNodeProps {
  data: {
    label: string;
    nodeId: string;
    isInitial: boolean;
    isTerminal: boolean;
    nodeType: 'initial' | 'final' | 'normal';
    transitions: Array<{
      name: string;
      next: string;
      manual?: boolean;
      processor?: string;
      criteria?: any;
    }>;
  };
  selected?: boolean;
}

const InformativeNode: React.FC<InformativeNodeProps> = ({ data, selected }) => {
  const { label, isInitial, isTerminal, nodeType, transitions = [] } = data;

  // Determine node styling based on type using unified theme
  const getNodeStyle = () => {
    if (isInitial) {
      return {
        background: workflowTheme.nodes.initial.gradient,
        borderColor: workflowTheme.nodes.initial.border,
        icon: <PlayCircle size={16} className="text-white" />
      };
    }
    if (isTerminal) {
      return {
        background: workflowTheme.nodes.terminal.gradient,
        borderColor: workflowTheme.nodes.terminal.border,
        icon: <StopCircle size={16} className="text-white" />
      };
    }
    return {
      background: workflowTheme.nodes.normal.gradient,
      borderColor: workflowTheme.nodes.normal.border,
      icon: <Circle size={16} className="text-white" />
    };
  };

  const style = getNodeStyle();

  // Count manual vs automatic transitions
  const manualTransitions = transitions.filter(t => t.manual).length;
  const autoTransitions = transitions.filter(t => !t.manual).length;

  return (
    <div
      className="informative-node"
      style={{
        background: style.background,
        border: `2px solid ${selected ? workflowTheme.nodes.selected.border : style.borderColor}`,
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '200px',
        boxShadow: selected
          ? `0 8px 24px ${workflowTheme.nodes.selected.glow}`
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        color: workflowTheme.text.primary,
        fontSize: '13px',
        transition: 'all 0.2s ease',
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Input Handle */}
      {!isInitial && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: workflowTheme.edges.default,
            width: '10px',
            height: '10px',
            border: `2px solid ${workflowTheme.text.primary}`,
          }}
        />
      )}

      {/* Node Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: transitions.length > 0 ? '8px' : '0'
      }}>
        {style.icon}
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '2px'
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '11px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isInitial && '🚀 Start'}
            {isTerminal && '✓ End'}
            {!isInitial && !isTerminal && `${transitions.length} transition${transitions.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Transitions Info */}
      {transitions.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '8px',
          marginTop: '8px'
        }}>
          {transitions.slice(0, 3).map((transition, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                marginBottom: index < Math.min(transitions.length, 3) - 1 ? '4px' : '0',
                opacity: 0.9
              }}
            >
              {transition.manual ? (
                <Lock size={12} style={{ flexShrink: 0 }} />
              ) : (
                <Unlock size={12} style={{ flexShrink: 0 }} />
              )}
              <ArrowRight size={12} style={{ flexShrink: 0 }} />
              <span style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {transition.name || 'unnamed'}
              </span>
              <span style={{
                opacity: 0.7,
                fontSize: '10px',
                marginLeft: 'auto',
                flexShrink: 0
              }}>
                → {transition.next}
              </span>
            </div>
          ))}
          {transitions.length > 3 && (
            <div style={{
              fontSize: '10px',
              opacity: 0.7,
              marginTop: '4px',
              textAlign: 'center'
            }}>
              +{transitions.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Transition Stats Badge */}
      {transitions.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {manualTransitions > 0 && (
            <div style={{
              background: workflowTheme.transitions.manual.badge.background,
              border: `1px solid ${workflowTheme.transitions.manual.badge.border}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: workflowTheme.transitions.manual.badge.text
            }}>
              <Lock size={10} />
              {manualTransitions} manual
            </div>
          )}
          {autoTransitions > 0 && (
            <div style={{
              background: workflowTheme.transitions.auto.badge.background,
              border: `1px solid ${workflowTheme.transitions.auto.badge.border}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: workflowTheme.transitions.auto.badge.text
            }}>
              <Unlock size={10} />
              {autoTransitions} auto
            </div>
          )}
        </div>
      )}

      {/* Output Handle */}
      {!isTerminal && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: workflowTheme.edges.default,
            width: '10px',
            height: '10px',
            border: `2px solid ${workflowTheme.text.primary}`,
          }}
        />
      )}
    </div>
  );
};

export default InformativeNode;

