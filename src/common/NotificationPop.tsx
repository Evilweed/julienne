import React from 'react';
import {store} from 'react-notifications-component';

const errorNotificationSettings = {
  type: 'danger',
  insert: 'top',
  container: 'top-right',
  animationIn: ['animated', 'fadeIn'],
  animationOut: ['animated', 'fadeOut'],
  dismiss: {
    duration: 10000,
    onScreen: true,
  },
};

export class NotificationPop {
  static showError(error: Error) {
    store.addNotification({
      title: `Error: ${error.name}`,
      message: error.message,
      ...errorNotificationSettings,
    });
  }
}
