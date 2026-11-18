import { Redirect, useLocalSearchParams } from 'expo-router';
export default function ListeningExamRedirect() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  return <Redirect href={{ pathname: '/listening/[examId]/full', params: { examId } }} />;
}
