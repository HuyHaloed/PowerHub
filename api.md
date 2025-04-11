# Thingsboard IOT Dashboard APIs
This document describes the necessary APIs to operate the Power Hub energy monitoring dashboard system.

## 1. Authentication APIs

### 1.1. Login
- **Endpoint**: `/api/auth/login`
- **Method**: `POST`
- **Description**: Logs in to the system
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "token": "string",
    "user": {
      "id": "number",
      "name": "string",
      "email": "string",
      "subscription": {
        "plan": "string",  // if the group wants to implement Premium, add it here
        "validUntil": "date"
      }
    }
  }
  ```

### 1.2. Logout
- **Endpoint**: `/api/auth/logout`
- **Method**: `POST`
- **Description**: Logs out of the system
- **Response**: Status `200 OK`

### 1.3. Get Current User
- **Endpoint**: `/api/auth/me`
- **Method**: `GET`
- **Description**: Retrieves the current user's information
- **Response**:
  ```json
  {
    "id": "number",
    "name": "string",
    "email": "string",
    "subscription": {
      "plan": "string",
      "validUntil": "date"
    },
    "preferences": {
      "theme": "string",
      "notifications": "boolean",
      "energyGoal": "number"
    }
  }
  ```

## 2. Dashboard APIs

### 2.1. Get Dashboard Data
- **Endpoint**: `/api/dashboard`
- **Method**: `GET`
- **Description**: Retrieves the overview data for the dashboard
- **Response**:
  ```json
  {
    "user": {
      "id": "number",
      "name": "string",
      "email": "string",
      "avatar": "string",
      "subscription": {
        "plan": "string",
        "validUntil": "date"
      },
      "preferences": {
        "theme": "string",
        "notifications": "boolean",
        "energyGoal": "number"
      }
    },
    "stats": [
      {
        "id": "number",
        "title": "string",
        "value": "number",
        "unit": "string",
        "change": "number",
        "changeType": "increase | decrease"
      }
    ],
    "alerts": [
      {
        "id": "number",
        "title": "string",
        "message": "string",
        "severity": "info | warning | error",
        "read": "boolean",
        "date": "date"
      }
    ]
  }
  ```

### 2.2. Get Quick Stats
- **Endpoint**: `/api/dashboard/quick-stats`
- **Method**: `GET`
- **Description**: Retrieves quick statistics
- **Response**:
  ```json
  [
    {
      "id": "number",
      "title": "string",
      "value": "number",
      "unit": "string",
      "change": "number",
      "changeType": "increase | decrease",
      "icon": "string"
    }
  ]
  ```

### 2.3. Get Unread Alerts
- **Endpoint**: `/api/dashboard/alerts/unread`
- **Method**: `GET`
- **Description**: Retrieves unread alerts
- **Response**:
  ```json
  [
    {
      "id": "number",
      "title": "string",
      "message": "string",
      "severity": "info | warning | error",
      "date": "date"
    }
  ]
  ```

### 2.4. Mark Alert as Read
- **Endpoint**: `/api/dashboard/alerts/{id}/read`
- **Method**: `PUT`
- **Description**: Marks an alert as read
- **Response**: Status `200 OK`

## 3. Energy Data APIs

### 3.1. Get Energy Consumption
- **Endpoint**: `/api/energy/consumption`
- **Method**: `GET`
- **Description**: Retrieves energy consumption data
- **Query Parameters**:
  - `timeRange`: `"day" | "week" | "month" | "year"`
  - `startDate`: `date` (optional)
  - `endDate`: `date` (optional)
- **Response**:
  ```json
  [
    {
      "name": "string",
      "value": "number",
      "date": "date"
    }
  ]
  ```

### 3.2. Get Energy Distribution
- **Endpoint**: `/api/energy/distribution`
- **Method**: `GET`
- **Description**: Retrieves energy consumption distribution by device
- **Response**:
  ```json
  [
    {
      "name": "string",
      "value": "number",
      "color": "string"
    }
  ]
  ```

### 3.3. Get Energy Predictions
- **Endpoint**: `/api/energy/predictions`
- **Method**: `GET`
- **Description**: Retrieves energy consumption predictions
- **Query Parameters**:
  - `timeRange`: `"day" | "week" | "month" | "year"`
  - `periods`: `number` (number of forecast periods)
- **Response**:
  ```json
  [
    {
      "name": "string",
      "value": "number",
      "prediction": "number",
      "date": "date"
    }
  ]
  ```

### 3.4. Compare Energy Usage
- **Endpoint**: `/api/energy/compare`
- **Method**: `GET`
- **Description**: Compares energy usage with the previous period
- **Query Parameters**:
  - `timeRange`: `"day" | "week" | "month" | "year"`
  - `startDate`: `date`
  - `endDate`: `date`
- **Response**:
  ```json
  {
    "currentPeriod": [
      {
        "name": "string",
        "value": "number",
        "date": "date"
      }
    ],
    "previousPeriod": [
      {
        "name": "string",
        "value": "number",
        "date": "date"
      }
    ],
    "comparison": {
      "change": "number",
      "changeType": "increase | decrease"
    }
  }
  ```

## 4. Device APIs

### 4.1. Get All Devices
- **Endpoint**: `/api/devices`
- **Method**: `GET`
- **Description**: Retrieves a list of all devices
- **Query Parameters**:
  - `status`: `"all" | "on" | "off"` (optional)
  - `location`: `string` (optional)
  - `type`: `string` (optional)
  - `search`: `string` (optional)
- **Response**:
  ```json
  [
    {
      "id": "number",
      "name": "string",
      "type": "string",
      "location": "string",
      "status": "on | off",
      "consumption": "number",
      "lastUpdated": "date"
    }
  ]
  ```

### 4.2. Get Active Devices
- **Endpoint**: `/api/devices/active`
- **Method**: `GET`
- **Description**: Retrieves a list of active devices
- **Response**:
  ```json
  [
    {
      "id": "number",
      "name": "string",
      "type": "string",
      "location": "string",
      "status": "on",
      "consumption": "number",
      "lastUpdated": "date"
    }
  ]
  ```

### 4.3. Get Device Details
- **Endpoint**: `/api/devices/{id}`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a device
- **Response**:
  ```json
  {
    "id": "number",
    "name": "string",
    "type": "string",
    "location": "string",
    "status": "on | off",
    "consumption": "number",
    "lastUpdated": "date",
    "history": [
      {
        "date": "date",
        "value": "number",
        "status": "on | off",
        "duration": "number"
      }
    ],
    "properties": {
      "brand": "string",
      "model": "string",
      "serialNumber": "string",
      "installDate": "date",
      "powerRating": "number"
    }
  }
  ```

### 4.4. Control Device
- **Endpoint**: `/api/devices/{id}/control`
- **Method**: `PUT`
- **Description**: Controls the device status
- **Request Body**:
  ```json
  {
    "status": "on | off"
  }
  ```
- **Response**:
  ```json
  {
    "id": "number",
    "name": "string",
    "status": "on | off",
    "message": "string"
  }
  ```

### 4.5. Add New Device
- **Endpoint**: `/api/devices`
- **Method**: `POST`
- **Description**: Adds a new device
- **Request Body**:
  ```json
  {
    "name": "string",
    "type": "string",
    "location": "string",
    "properties": {
      "brand": "string",
      "model": "string",
      "serialNumber": "string",
      "powerRating": "number"
    }
  }
  ```
- **Response**:
  ```json
  {
    "id": "number",
    "name": "string",
    "type": "string",
    "location": "string",
    "status": "off",
    "message": "string"
  }
  ```

### 4.6. Update Device
- **Endpoint**: `/api/devices/{id}`
- **Method**: `PUT`
- **Description**: Updates device information
- **Request Body**:
  ```json
  {
    "name": "string",
    "type": "string",
    "location": "string",
    "properties": {
      "brand": "string",
      "model": "string",
      "serialNumber": "string",
      "powerRating": "number"
    }
  }
  ```
- **Response**:
  ```json
  {
    "id": "number",
    "name": "string",
    "message": "string"
  }
  ```

### 4.7. Delete Device
- **Endpoint**: `/api/devices/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a device
- **Response**: Status `200 OK` with message

## 5. Analytics APIs

### 5.1. Get Analytics Data
- **Endpoint**: `/api/analytics`
- **Method**: `GET`
- **Description**: Retrieves overall analytics data
- **Query Parameters**:
  - `startDate`: `date`
  - `endDate`: `date`
  - `timeRange`: `"day" | "week" | "month" | "year"`
- **Response**:
  ```json
  {
    "totalConsumption": "number",
    "avgConsumption": "number",
    "peakConsumption": "number",
    "lowestConsumption": "number",
    "comparisonValue": "number",
    "estimatedCost": "number",
    "costPerKwh": "number",
    "data": [
      {
        "name": "string",
        "value": "number",
        "date": "date"
      }
    ]
  }
  ```

### 5.2. Get Device Analytics
- **Endpoint**: `/api/analytics/devices`
- **Method**: `GET`
- **Description**: Retrieves analytics data per device
- **Query Parameters**:
  - `deviceId`: `number` (optional)
  - `startDate`: `date`
  - `endDate`: `date`
  - `timeRange`: `"day" | "week" | "month" | "year"`
- **Response**:
  ```json
  [
    {
      "deviceId": "number",
      "deviceName": "string",
      "totalConsumption": "number",
      "avgConsumption": "number",
      "peakConsumption": "number",
      "onDuration": "number",
      "costEstimate": "number",
      "data": [
        {
          "date": "date",
          "value": "number"
        }
      ]
    }
  ]
  ```

### 5.3. Export Data
- **Endpoint**: `/api/analytics/export`
- **Method**: `GET`
- **Description**: Exports analytics data
- **Query Parameters**:
  - `format`: `"csv" | "pdf" | "excel"`
  - `startDate`: `date`
  - `endDate`: `date`
  - `type`: `"consumption" | "devices" | "distribution" | "all"`
- **Response**: Binary file download

## 6. User Settings APIs

### 6.1. Update User Profile
- **Endpoint**: `/api/users/profile`
- **Method**: `PUT`
- **Description**: Updates user profile information
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "phone": "string",
    "language": "string",
    "avatar": "file or string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "number",
    "name": "string",
    "email": "string",
    "message": "string"
  }
  ```

### 6.2. Change Password
- **Endpoint**: `/api/users/password`
- **Method**: `PUT`
- **Description**: Changes the user's password
- **Request Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string",
    "confirmPassword": "string"
  }
  ```
- **Response**: Status `200 OK` with message

### 6.3. Update Notification Settings
- **Endpoint**: `/api/users/notifications`
- **Method**: `PUT`
- **Description**: Updates notification settings
- **Request Body**:
  ```json
  {
    "emailNotifications": "boolean",
    "pushNotifications": "boolean",
    "highUsageAlerts": "boolean",
    "deviceStatusAlerts": "boolean",
    "weeklyReports": "boolean",
    "monthlyReports": "boolean"
  }
  ```
- **Response**: Status `200 OK` with message

### 6.4. Update User Preferences
- **Endpoint**: `/api/users/preferences`
- **Method**: `PUT`
- **Description**: Updates user preferences
- **Request Body**:
  ```json
  {
    "theme": "light | dark | system",
    "animations": "boolean",
    "energyGoal": "number",
    "alertThreshold": "number"
  }
  ```
- **Response**: Status `200 OK` with message

### 6.5. Delete Account
- **Endpoint**: `/api/users/account`
- **Method**: `DELETE`
- **Description**: Deletes the user account
- **Request Body**:
  ```json
  {
    "password": "string",
    "confirmationText": "string"
  }
  ```
- **Response**: Status `200 OK` with message

## 7. Subscription APIs

### 7.1. Get Subscription Details
- **Endpoint**: `/api/subscription`
- **Method**: `GET`
- **Description**: Retrieves subscription details
- **Response**:
  ```json
  {
    "plan": "string",
    "validUntil": "date",
    "features": [
      "string"
    ],
    "price": "number",
    "billingCycle": "string",
    "paymentMethod": {
      "type": "string",
      "lastFour": "string",
      "expiryDate": "string"
    },
    "history": [
      {
        "date": "date",
        "amount": "number",
        "status": "string"
      }
    ]
  }
  ```

### 7.2. Upgrade Subscription
- **Endpoint**: `/api/subscription/upgrade`
- **Method**: `POST`
- **Description**: Upgrades the subscription plan
- **Request Body**:
  ```json
  {
    "plan": "string",
    "paymentMethodId": "string"
  }
  ```
- **Response**: Status `200 OK` with details

### 7.3. Add Payment Method
- **Endpoint**: `/api/subscription/payment-methods`
- **Method**: `POST`
- **Description**: Adds a payment method
- **Request Body**:
  ```json
  {
    "type": "credit | debit",
    "cardNumber": "string",
    "expiryDate": "string",
    "cvc": "string",
    "cardholderName": "string"
  }
  ```
- **Response**: Status `200 OK` with details

### 7.4. Get Payment History
- **Endpoint**: `/api/subscription/payments`
- **Method**: `GET`
- **Description**: Retrieves payment history
- **Response**:
  ```json
  [
    {
      "id": "string",
      "date": "date",
      "amount": "number",
      "description": "string",
      "status": "string"
    }
  ]
  ```

## 8. Security APIs

### 8.1. Enable Two-Factor Authentication
- **Endpoint**: `/api/security/2fa/enable`
- **Method**: `POST`
- **Description**: Enables two-factor authentication
- **Response**:
  ```json
  {
    "qrCode": "string",
    "secret": "string"
  }
  ```

### 8.2. Verify Two-Factor Authentication
- **Endpoint**: `/api/security/2fa/verify`
- **Method**: `POST`
- **Description**: Verifies the two-factor authentication code
- **Request Body**:
  ```json
  {
    "code": "string"
  }
  ```
- **Response**: Status `200 OK`

### 8.3. Disable Two-Factor Authentication
- **Endpoint**: `/api/security/2fa/disable`
- **Method**: `POST`
- **Description**: Disables two-factor authentication
- **Request Body**:
  ```json
  {
    "password": "string"
  }
  ```
- **Response**: Status `200 OK`

### 8.4. Get Active Sessions
- **Endpoint**: `/api/security/sessions`
- **Method**: `GET`
- **Description**: Retrieves a list of active login sessions
- **Response**:
  ```json
  [
    {
      "id": "string",
      "device": "string",
      "browser": "string",
      "ip": "string",
      "location": "string",
      "lastActive": "date",
      "current": "boolean"
    }
  ]
  ```

### 8.5. Revoke Session
- **Endpoint**: `/api/security/sessions/{id}`
- **Method**: `DELETE`
- **Description**: Revokes a login session
- **Response**: Status `200 OK`

### 8.6. Export Personal Data
- **Endpoint**: `/api/security/data-export`
- **Method**: `POST`
- **Description**: Exports all personal data
- **Response**: Status `200 OK` with link to download

## 9. Notification APIs

### 9.1. Get All Notifications
- **Endpoint**: `/api/notifications`
- **Method**: `GET`
- **Description**: Retrieves all notifications
- **Query Parameters**:
  - `page`: `number`
  - `limit`: `number`
  - `read`: `boolean` (optional)
- **Response**:
  ```json
  {
    "total": "number",
    "unread": "number",
    "notifications": [
      {
        "id": "string",
        "title": "string",
        "message": "string",
        "type": "string",
        "read": "boolean",
        "date": "date",
        "action": {
          "type": "string",
          "url": "string"
        }
      }
    ]
  }
  ```

### 9.2. Mark Notification as Read
- **Endpoint**: `/api/notifications/{id}/read`
- **Method**: `PUT`
- **Description**: Marks a notification as read
- **Response**: Status `200 OK`

### 9.3. Mark All Notifications as Read
- **Endpoint**: `/api/notifications/read-all`
- **Method**: `PUT`
- **Description**: Marks all notifications as read
- **Response**: Status `200 OK`

### 9.4. Delete Notification
- **Endpoint**: `/api/notifications/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a notification
- **Response**: Status `200 OK`

## 10. Realtime APIs

### 10.1. WebSocket Connection
- **Endpoint**: `/ws`
- **Description**: Establishes a WebSocket connection to receive realtime data

### 10.2. WebSocket Events
- **Device Status Change**:
  ```json
  {
    "type": "device_status",
    "data": {
      "deviceId": "number",
      "status": "on | off",
      "timestamp": "date"
    }
  }
  ```

- **Energy Consumption Update**:
  ```json
  {
    "type": "energy_update",
    "data": {
      "timestamp": "date",
      "value": "number",
      "deviceId": "number (optional)"
    }
  }
  ```

- **Alert Notification**:
  ```json
  {
    "type": "alert",
    "data": {
      "id": "string",
      "title": "string",
      "message": "string",
      "severity": "info | warning | error",
      "timestamp": "date"
    }
  }
  ```

- **System Status**:
  ```json
  {
    "type": "system_status",
    "data": {
      "status": "online | maintenance | error",
      "message": "string",
      "timestamp": "date"
    }
  }
  ```