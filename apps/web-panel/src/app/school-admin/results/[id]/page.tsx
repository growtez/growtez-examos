import { ResultsListContent } from '../PageContent';

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  return <ResultsListContent examIdProp={params.id} />;
}
