import validator from 'email-validator';

export const validateEmail = (email: string): boolean => {
  return validator.validate(email);
};

export const validateMessage = (message: string): boolean => {
  return !!(message && message.trim().length > 0);
};

export const validateTitle = (title: string): boolean => {
  return !!(title && title.trim().length > 0 && title.length <= 100);
};

export const validateSummary = (summary: string): boolean => {
  return !!(summary && summary.length <= 500);
};

export const validateStatus = (status: string): boolean => {
  const validStatuses = ['Draft', 'New', 'Assigned', 'Solving', 'Solved', 'Failed', 'Renew'];
  return validStatuses.includes(status);
};

export const validateStatusTransition = (oldStatus: string, newStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    'Draft': ['New'],
    'New': ['Assigned', 'Renew'],
    'Assigned': ['Solving', 'Renew'],
    'Solving': ['Solved', 'Failed', 'Renew'],
    'Solved': ['Renew'],
    'Failed': ['Renew'],
    'Renew': ['New']
  };

  return (validTransitions[oldStatus] || []).includes(newStatus);
};
