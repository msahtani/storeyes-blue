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







