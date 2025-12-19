import AlertScreen from '@/domains/alerts/screens/AlertScreen';
import { BackgroundColors } from '@/constants/Colors';

export default function AlertsRoute() {
  return <AlertScreen backgroundColor={BackgroundColors.darkBlue} />;
}

