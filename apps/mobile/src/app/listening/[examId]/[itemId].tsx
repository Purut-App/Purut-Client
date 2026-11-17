import { Redirect, useLocalSearchParams } from 'expo-router';
export default function ListeningItemRedirect() {
  const { examId, itemId } = useLocalSearchParams<{ examId: string; itemId: string }>();
  return (
    <Redirect
      href={{ pathname: '/listening/[examId]/full', params: { examId, itemId, script: '1' } }}
    />
  );
}
