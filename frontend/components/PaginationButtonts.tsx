
interface PaginationButtonsProps {
    previousClicked: () => void;
    previousDisabled: boolean;
    nextClicked: () => void;
    nextDisabled: boolean;
    currentPage: number;
    totalPages: number;
}

export function PaginationButtons(props: PaginationButtonsProps) {
    return <div className="flex items-center justify-between mt-6 mb-5">
        <button aria-label={"previous page"} onClick={props.previousClicked} disabled={props.previousDisabled} className="disabled:border-white disabled:hover:bg-white  flex items-center px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md gap-x-2 hover:bg-gray-100 dark:bg-gray-900  dark:border-gray-700 dark:hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:-scale-x-100">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
            </svg>

            <span>
                previous
            </span>
        </button>
        <div className={"mx-auto text-center"}>
            {props.currentPage + 1}/{props.totalPages}
        </div>
        <button aria-label="Next page" onClick={props.nextClicked} disabled={props.nextDisabled} className="disabled:border-white disabled:hover:bg-white	 flex items-center px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md gap-x-2 hover:bg-gray-100 dark:bg-gray-900  dark:border-gray-700 dark:hover:bg-gray-800">
            <span>
                Next
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:-scale-x-100">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
        </button>
    </div>
}
