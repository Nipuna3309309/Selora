/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "clothes": {
    "tableId": "Clothes",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetCategory": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Category",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetSize": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Size",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "clothes_1": {
    "tableId": "Clothes",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetCategory": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Category",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetSize": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Size",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "clothingcosts": {
    "tableId": "ClothingCosts",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetRecordType": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/RecordType",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetClothing": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Clothing",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "clothingcosts_1": {
    "tableId": "ClothingCosts",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetRecordType": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/RecordType",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetClothing": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Clothing",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "notifications": {
    "tableId": "Notifications",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetRecipient": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Recipient",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetNotificationType": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/NotificationType",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEmailStatus": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/EmailStatus",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "notifications_1": {
    "tableId": "Notifications",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetRecipient": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Recipient",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetNotificationType": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/NotificationType",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEmailStatus": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/EmailStatus",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "orders": {
    "tableId": "Orders",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetClothing": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Clothing",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetSimulatedPayment": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/SimulatedPayment",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetStatus": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Status",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetProcessingStage": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/ProcessingStage",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "orders_1": {
    "tableId": "Orders",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetClothing": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Clothing",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetSimulatedPayment": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/SimulatedPayment",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetStatus": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Status",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetProcessingStage": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/ProcessingStage",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "selora_account": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "selora_processorder": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          }
        }
      }
    }
  },
  "selora_restockrequest": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          }
        }
      }
    }
  },
  "selora_supplieroffer": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "selora_supplierrequests": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "sharepointonline": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "CreateAgreementsSolutionDocument": {
        "path": "/{connectionId}/datasets/{dataset}/agreements/templates/{template}/createnewdocument",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "template",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "documentName",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetAllTables": {
        "path": "/{connectionId}/datasets/{dataset}/alltables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ApproveHubSiteJoin": {
        "path": "/{connectionId}/datasets/{dataset}/approvehubsitejoin",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "joiningSiteId",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CancelHubSiteJoinApproval": {
        "path": "/{connectionId}/datasets/{dataset}/cancelhubsitejoinapproval",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "approvalCorrelationId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateSharingLink": {
        "path": "/{connectionId}/datasets/{dataset}/codeless/_api/v2.0/sites/root/lists/{table}/items/{id}/driveItem/createLink",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "permission",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CopyFile": {
        "path": "/{connectionId}/datasets/{dataset}/copyFile",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "source",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "destination",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "overwrite",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CopyFileAsync": {
        "path": "/{connectionId}/datasets/{dataset}/copyFileAsync",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CopyFolderAsync": {
        "path": "/{connectionId}/datasets/{dataset}/copyFolderAsync",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ExtractFolderV2": {
        "path": "/{connectionId}/datasets/{dataset}/extractFolderV2",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "source",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "destination",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "overwrite",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateFile": {
        "path": "/{connectionId}/datasets/{dataset}/files",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "name",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileMetadata": {
        "path": "/{connectionId}/datasets/{dataset}/files/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateFile": {
        "path": "/{connectionId}/datasets/{dataset}/files/{id}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteFile": {
        "path": "/{connectionId}/datasets/{dataset}/files/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileContent": {
        "path": "/{connectionId}/datasets/{dataset}/files/{id}/content",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "inferContentType",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileThumbnail": {
        "path": "/{connectionId}/datasets/{dataset}/files/{id}/thumbnail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "size",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListRootFolder": {
        "path": "/{connectionId}/datasets/{dataset}/folders",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListFolder": {
        "path": "/{connectionId}/datasets/{dataset}/folders/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileMetadataByPath": {
        "path": "/{connectionId}/datasets/{dataset}/GetFileByPath",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "path",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileContentByPath": {
        "path": "/{connectionId}/datasets/{dataset}/GetFileContentByPath",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "path",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "inferContentType",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFolderMetadata": {
        "path": "/{connectionId}/datasets/{dataset}/GetFolder",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFolderMetadataByPath": {
        "path": "/{connectionId}/datasets/{dataset}/GetFolderByPath",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "path",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "HttpRequest": {
        "path": "/{connectionId}/datasets/{dataset}/httprequest",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "default": {
            "type": "object"
          }
        }
      },
      "JoinHubSite": {
        "path": "/{connectionId}/datasets/{dataset}/joinhubsite",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "hubSiteId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "approvalToken",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "approvalCorrelationId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MoveFileAsync": {
        "path": "/{connectionId}/datasets/{dataset}/moveFileAsync",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MoveFolderAsync": {
        "path": "/{connectionId}/datasets/{dataset}/moveFolderAsync",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "NotifyHubSiteJoinApprovalStarted": {
        "path": "/{connectionId}/datasets/{dataset}/notifyhubsitejoinapprovalstarted",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "approvalCorrelationId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetTables": {
        "path": "/{connectionId}/datasets/{dataset}/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateNewDocumentSet": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/createnewdocumentset",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateNewFolder": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/createnewfolder",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SearchForUser": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/entities/{entityId}/searchforuser",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "searchValue",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetTableForm": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/forms/{form}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "form",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SubmitDocGenForm": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/forms/{form}/submitdocgenform",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "form",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/getfileitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "viewScopeOption",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "viewScopeOption",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PostItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PatchItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateApprovalRequest": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/approval",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "approvalType",
            "in": "query",
            "required": true,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "approvalSchema",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetItemChanges": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/changes",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "since",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "until",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeDrafts",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CheckIfFileIsPublished": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/checkiffileispublished",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "scheduledVersion",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CheckInFile": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/checkinfile",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "parameter",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CheckOutFile": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/checkoutfile",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DiscardFileCheckOut": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/discardfilecheckout",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFileItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/getfileitem",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GrantAccess": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/grantaccess",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "parameter",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PatchFileItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/patchfileitem",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PatchFileItemWithPredictedValues": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/patchfileitemwithpredictedvalues",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "parameters",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SetApprovalStatus": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/setapprovalstatus",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "approvalAction",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "comments",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "entityTag",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UnshareItem": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{id}/unshare",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetItemAttachments": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{itemId}/attachments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "itemId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateAttachment": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{itemId}/attachments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "itemId",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "displayName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteAttachment": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{itemId}/attachments/{attachmentId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "itemId",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "attachmentId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetAttachmentContent": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/items/{itemId}/attachments/{attachmentId}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "itemId",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          },
          {
            "name": "attachmentId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnChangedItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnDeletedFileItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/ondeletedfileitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnDeletedItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/ondeleteditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnNewFileItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onnewfileitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnNewItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnNewItemsFromForm": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onnewitemsfromform",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "form",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnRecurrenceDigest": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onrecurrencedigest",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "update",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "add",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "runSchedule",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "startTime",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnUpdatedFileClassifiedTimes": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onupdatedfileclassifiedtimes",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnUpdatedFileItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onupdatedfileitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOnUpdatedItems": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateContentAssemblyDocument": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/templates/{template}/createnewdocument",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "template",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fileName",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "view",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetTableViews": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{table}/views",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewFile": {
        "path": "/{connectionId}/datasets/{dataset}/triggers/onnewfile",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "inferContentType",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnUpdatedFile": {
        "path": "/{connectionId}/datasets/{dataset}/triggers/onupdatedfile",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeFileContent",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "inferContentType",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "queryParametersSingleEncoded",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "users": {
    "tableId": "Users",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetUserAccount": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/UserAccount",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetRole": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Role",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  },
  "users_1": {
    "tableId": "Users",
    "version": "",
    "primaryKey": "ID",
    "dataSourceType": "Connector",
    "apis": {
      "GetUserAccount": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/UserAccount",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetRole": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Role",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAuthor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Author",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetEditor": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/Editor",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get4651e8f238c94ad08def41f743f76f30": {
        "path": "/{connectionId}/datasets/{dataset}/tables/{tableName}/entities/4651e8f238c94ad08def41f743f76f30",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "dataset",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "tableName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  }
};
