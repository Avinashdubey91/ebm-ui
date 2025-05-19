import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export const useNotificationContext = () => {
  return useContext(NotificationContext);
};
