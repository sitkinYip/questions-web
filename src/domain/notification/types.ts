export interface Notification {
  id: string;
  title: string;
  content: string;
  popupTitle?: string;
  buttonText?: string;
  userId?: string;
  createdAt: string;
  revision: string;
}
