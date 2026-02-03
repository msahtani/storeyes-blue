export type Alert = {
  id: number;
  alertDate: string;
  mainVideoUrl: string;
  productName: string;
  imageUrl: string;
  secondaryVideoUrl: string | null;
  humanJudgement: string;
  humanJudgementComment: string | null;
  createdAt: string;
  updatedAt: string;
  processed: boolean;
};

export type AlertSale = {
  id: number;
  soldAt: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  category: string | null;
  createdAt: string;
};

export type AlertDetails = Omit<Alert, 'processed'> & {
  processed: boolean;
  sales: AlertSale[];
};

/** i18n key for human judgement status (use with t() for display). */
export function getHumanJudgementLabelKey(judgement: string | null | undefined): string | null {
  if (!judgement) return null;
  switch (judgement) {
    case 'NEW':
      return 'alerts.details.statusToVerify';
    case 'TRUE_POSITIVE':
      return 'alerts.details.statusConfirmed';
    case 'FALSE_POSITIVE':
      return 'alerts.details.statusFalseAlert';
    case 'UNKNOWN':
      return 'alerts.details.statusUnknown';
    default:
      return null;
  }
}
