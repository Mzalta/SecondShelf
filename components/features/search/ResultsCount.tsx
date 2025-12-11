interface ResultsCountProps {
  count: number
  total?: number
}

export default function ResultsCount({ count, total }: ResultsCountProps) {
  if (count === 0) {
    return (
      <div className="text-center text-gray-600 text-sm mt-4">
        No results found
      </div>
    )
  }
  
  return (
    <div className="text-center text-gray-600 text-sm mt-4">
      Showing {count} listing{count !== 1 ? 's' : ''}
      {total !== undefined && total !== count && ` of ${total}`}
    </div>
  )
}
