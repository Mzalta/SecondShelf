interface ResultsCountProps {
  count: number
  total?: number
}

export default function ResultsCount({ count, total }: ResultsCountProps) {
  if (count === 0) {
    return (
      <div className="text-gray-600 text-sm">
        No results found
      </div>
    )
  }
  
  return (
    <div className="text-gray-700 text-sm font-medium">
      {total !== undefined && total !== count 
        ? `Showing ${count} of ${total} result${total !== 1 ? 's' : ''}`
        : `${count} result${count !== 1 ? 's' : ''}`
      }
    </div>
  )
}
