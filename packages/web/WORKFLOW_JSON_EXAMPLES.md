# Workflow JSON Examples

This document provides complete examples of workflow JSON structures that can be rendered in the workflow editor.

---

## Table of Contents
1. [Basic Workflow Structure](#basic-workflow-structure)
2. [Simple Linear Workflow](#simple-linear-workflow)
3. [Conditional Workflow with Branches](#conditional-workflow-with-branches)
4. [Complex Workflow with Processors](#complex-workflow-with-processors)
5. [Approval Workflow](#approval-workflow)
6. [Data Processing Pipeline](#data-processing-pipeline)
7. [Complete Workflow Object](#complete-workflow-object)

---

## Basic Workflow Structure

The minimal structure required for a workflow:

```json
{
  "initial_state": "start",
  "states": {
    "start": {
      "transitions": [
        {
          "name": "proceed",
          "next": "end"
        }
      ]
    },
    "end": {
      "transitions": []
    }
  }
}
```

**Visual Representation:**
```
[start] --proceed--> [end]
```

---

## Simple Linear Workflow

A basic sequential workflow with multiple steps:

```json
{
  "initial_state": "draft",
  "states": {
    "draft": {
      "transitions": [
        {
          "name": "submit",
          "next": "review",
          "manual": true
        }
      ]
    },
    "review": {
      "transitions": [
        {
          "name": "approve",
          "next": "approved",
          "manual": true
        },
        {
          "name": "reject",
          "next": "rejected",
          "manual": true
        }
      ]
    },
    "approved": {
      "transitions": []
    },
    "rejected": {
      "transitions": []
    }
  }
}
```

**Visual Representation:**
```
[draft] --submit--> [review] --approve--> [approved]
                              \
                               --reject--> [rejected]
```

---

## Conditional Workflow with Branches

Workflow with conditional transitions based on criteria:

```json
{
  "initial_state": "validate_input",
  "states": {
    "validate_input": {
      "transitions": [
        {
          "name": "valid",
          "next": "process_data",
          "criteria": [
            {
              "type": "simple",
              "name": "input_valid",
              "operator": "EQUALS",
              "parameters": [
                {
                  "jsonPath": "$.validation.status",
                  "operatorType": "EQUALS",
                  "value": "valid",
                  "type": "string"
                }
              ]
            }
          ]
        },
        {
          "name": "invalid",
          "next": "error_state",
          "criteria": [
            {
              "type": "simple",
              "name": "input_invalid",
              "operator": "EQUALS",
              "parameters": [
                {
                  "jsonPath": "$.validation.status",
                  "operatorType": "EQUALS",
                  "value": "invalid",
                  "type": "string"
                }
              ]
            }
          ]
        }
      ]
    },
    "process_data": {
      "transitions": [
        {
          "name": "complete",
          "next": "completed"
        }
      ]
    },
    "error_state": {
      "transitions": []
    },
    "completed": {
      "transitions": []
    }
  }
}
```

**Visual Representation:**
```
[validate_input] --valid (if status=valid)--> [process_data] --complete--> [completed]
                \
                 --invalid (if status=invalid)--> [error_state]
```

---

## Complex Workflow with Processors

Workflow with data processors at each transition:

```json
{
  "initial_state": "new_request",
  "states": {
    "new_request": {
      "transitions": [
        {
          "name": "start_processing",
          "next": "validate",
          "processors": [
            {
              "name": "LogProcessor",
              "config": {
                "message": "Starting request processing",
                "level": "INFO"
              }
            },
            {
              "name": "TimestampProcessor",
              "config": {
                "field": "started_at"
              }
            }
          ]
        }
      ]
    },
    "validate": {
      "transitions": [
        {
          "name": "validation_passed",
          "next": "enrich_data",
          "processors": [
            {
              "name": "ValidationProcessor",
              "config": {
                "rules": ["required_fields", "data_types"]
              }
            }
          ],
          "criteria": [
            {
              "type": "function",
              "function": {
                "name": "checkValidation"
              }
            }
          ]
        },
        {
          "name": "validation_failed",
          "next": "failed",
          "processors": [
            {
              "name": "ErrorLogProcessor",
              "config": {
                "error_type": "validation_error"
              }
            }
          ]
        }
      ]
    },
    "enrich_data": {
      "transitions": [
        {
          "name": "enrichment_complete",
          "next": "process",
          "processors": [
            {
              "name": "DataEnrichmentProcessor",
              "config": {
                "sources": ["external_api", "database"]
              }
            }
          ]
        }
      ]
    },
    "process": {
      "transitions": [
        {
          "name": "processing_complete",
          "next": "completed",
          "processors": [
            {
              "name": "BusinessLogicProcessor",
              "config": {
                "operations": ["calculate", "transform", "aggregate"]
              }
            },
            {
              "name": "NotificationProcessor",
              "config": {
                "recipients": ["admin@example.com"],
                "template": "processing_complete"
              }
            }
          ]
        }
      ]
    },
    "completed": {
      "transitions": []
    },
    "failed": {
      "transitions": []
    }
  }
}
```

**Visual Representation:**
```
[new_request] --start_processing--> [validate] --validation_passed--> [enrich_data] --enrichment_complete--> [process] --processing_complete--> [completed]
                                              \
                                               --validation_failed--> [failed]
```

---

## Approval Workflow

Multi-level approval workflow:

```json
{
  "initial_state": "submitted",
  "states": {
    "submitted": {
      "transitions": [
        {
          "name": "assign_to_manager",
          "next": "manager_review",
          "manual": false,
          "processors": [
            {
              "name": "AssignmentProcessor",
              "config": {
                "role": "manager"
              }
            }
          ]
        }
      ]
    },
    "manager_review": {
      "transitions": [
        {
          "name": "manager_approve",
          "next": "director_review",
          "manual": true,
          "processors": [
            {
              "name": "ApprovalProcessor",
              "config": {
                "level": "manager",
                "action": "approve"
              }
            }
          ]
        },
        {
          "name": "manager_reject",
          "next": "rejected",
          "manual": true,
          "processors": [
            {
              "name": "RejectionProcessor",
              "config": {
                "level": "manager",
                "notify_submitter": true
              }
            }
          ]
        },
        {
          "name": "request_changes",
          "next": "changes_requested",
          "manual": true
        }
      ]
    },
    "director_review": {
      "transitions": [
        {
          "name": "director_approve",
          "next": "approved",
          "manual": true,
          "processors": [
            {
              "name": "FinalApprovalProcessor",
              "config": {
                "level": "director"
              }
            }
          ]
        },
        {
          "name": "director_reject",
          "next": "rejected",
          "manual": true
        }
      ]
    },
    "changes_requested": {
      "transitions": [
        {
          "name": "resubmit",
          "next": "manager_review",
          "manual": true
        }
      ]
    },
    "approved": {
      "transitions": []
    },
    "rejected": {
      "transitions": []
    }
  }
}
```

---

## Data Processing Pipeline

ETL (Extract, Transform, Load) workflow:

```json
{
  "initial_state": "extract",
  "states": {
    "extract": {
      "transitions": [
        {
          "name": "data_extracted",
          "next": "transform",
          "processors": [
            {
              "name": "DataExtractor",
              "config": {
                "source": "database",
                "query": "SELECT * FROM source_table"
              }
            }
          ]
        },
        {
          "name": "extraction_failed",
          "next": "error"
        }
      ]
    },
    "transform": {
      "transitions": [
        {
          "name": "data_transformed",
          "next": "validate_transform",
          "processors": [
            {
              "name": "DataTransformer",
              "config": {
                "operations": [
                  "normalize",
                  "deduplicate",
                  "enrich"
                ]
              }
            }
          ]
        }
      ]
    },
    "validate_transform": {
      "transitions": [
        {
          "name": "validation_passed",
          "next": "load",
          "criteria": [
            {
              "type": "simple",
              "name": "data_quality_check",
              "operator": "GREATER_THAN",
              "parameters": [
                {
                  "jsonPath": "$.quality_score",
                  "operatorType": "GREATER_THAN",
                  "value": 0.95,
                  "type": "number"
                }
              ]
            }
          ]
        },
        {
          "name": "validation_failed",
          "next": "error"
        }
      ]
    },
    "load": {
      "transitions": [
        {
          "name": "data_loaded",
          "next": "completed",
          "processors": [
            {
              "name": "DataLoader",
              "config": {
                "destination": "data_warehouse",
                "table": "target_table"
              }
            }
          ]
        }
      ]
    },
    "completed": {
      "transitions": []
    },
    "error": {
      "transitions": [
        {
          "name": "retry",
          "next": "extract",
          "manual": true
        }
      ]
    }
  }
}
```

---

## Complete Workflow Object

This is how a complete workflow is stored (including metadata):

```json
{
  "technical_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Order Processing Workflow",
  "description": "Handles order validation, payment, and fulfillment",
  "date": "2024-01-15T10:30:00.000Z",
  "workflowMetaData": {
    "version": "1.0.0",
    "author": "admin@example.com",
    "created": "2024-01-15T10:30:00.000Z",
    "modified": "2024-01-20T14:45:00.000Z",
    "tags": ["order", "payment", "fulfillment"]
  },
  "canvasData": {
    "initial_state": "order_received",
    "states": {
      "order_received": {
        "transitions": [
          {
            "name": "validate_order",
            "next": "validation",
            "processors": [
              {
                "name": "OrderValidationProcessor"
              }
            ]
          }
        ]
      },
      "validation": {
        "transitions": [
          {
            "name": "valid",
            "next": "payment_processing",
            "criteria": [
              {
                "type": "simple",
                "name": "order_valid",
                "operator": "EQUALS",
                "parameters": [
                  {
                    "jsonPath": "$.order.valid",
                    "operatorType": "EQUALS",
                    "value": true,
                    "type": "boolean"
                  }
                ]
              }
            ]
          },
          {
            "name": "invalid",
            "next": "rejected"
          }
        ]
      },
      "payment_processing": {
        "transitions": [
          {
            "name": "payment_success",
            "next": "fulfillment",
            "processors": [
              {
                "name": "PaymentProcessor",
                "config": {
                  "gateway": "stripe"
                }
              }
            ]
          },
          {
            "name": "payment_failed",
            "next": "payment_failed_state"
          }
        ]
      },
      "fulfillment": {
        "transitions": [
          {
            "name": "shipped",
            "next": "completed",
            "processors": [
              {
                "name": "ShippingProcessor"
              },
              {
                "name": "NotificationProcessor",
                "config": {
                  "template": "order_shipped"
                }
              }
            ]
          }
        ]
      },
      "completed": {
        "transitions": []
      },
      "rejected": {
        "transitions": []
      },
      "payment_failed_state": {
        "transitions": [
          {
            "name": "retry_payment",
            "next": "payment_processing",
            "manual": true
          }
        ]
      }
    }
  }
}
```

---

## Key Points

### Required Fields
- `initial_state`: The starting state of the workflow
- `states`: Object containing all workflow states
- Each state must have a `transitions` array (can be empty for terminal states)

### Transition Properties
- `name`: Unique identifier for the transition
- `next`: Target state name
- `manual`: (optional) If true, requires manual trigger
- `processors`: (optional) Array of processors to execute
- `criteria`: (optional) Conditions that must be met

### State Types
- **Initial State**: Defined by `initial_state` field
- **Intermediate States**: Have outgoing transitions
- **Terminal States**: Have empty `transitions` array

### Rendering Notes
- The workflow editor will automatically layout nodes using Dagre algorithm
- Nodes are color-coded based on type (initial, normal, terminal)
- Edges show transition names as labels
- Conditional transitions display criteria information

---

## Testing Your Workflow

### Validation Checklist
- [ ] `initial_state` exists in `states` object
- [ ] All `next` values reference existing states
- [ ] No circular dependencies (unless intentional)
- [ ] Terminal states have empty `transitions` array
- [ ] All required fields are present
- [ ] JSON is valid and properly formatted

### Common Errors
1. **Missing initial_state**: Workflow won't render
2. **Invalid next reference**: Transition will fail
3. **Malformed JSON**: Parser will reject
4. **Empty states object**: No nodes to display

### Example Test Workflow

Paste this into the Monaco editor to test:

```json
{
  "initial_state": "start",
  "states": {
    "start": {
      "transitions": [
        {
          "name": "begin",
          "next": "processing"
        }
      ]
    },
    "processing": {
      "transitions": [
        {
          "name": "success",
          "next": "end"
        },
        {
          "name": "error",
          "next": "error_handler"
        }
      ]
    },
    "error_handler": {
      "transitions": [
        {
          "name": "retry",
          "next": "processing",
          "manual": true
        },
        {
          "name": "abort",
          "next": "end",
          "manual": true
        }
      ]
    },
    "end": {
      "transitions": []
    }
  }
}
```

This creates a simple workflow with error handling and retry logic.

