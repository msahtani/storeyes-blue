import { BackgroundColors } from '@/constants/Colors';
import HomeScreen from '@/domains/alerts/screens/AlertScreen';

export default function TabOneScreen() {
  // You can configure the background color here
  return <HomeScreen backgroundColor={BackgroundColors.darkBlue} />;
}
