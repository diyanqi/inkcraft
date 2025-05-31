// hooks/use-correction-history.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
// Assuming Correction type is here or imported
// import { Correction } from '@/utils/corrections';

// Define the type for a history item (match what your API returns and what NavHistory uses)
interface CorrectionHistoryItem {
  uuid: string;
  title: string;
  icon: string;
  // Add any other properties needed in the UI, e.g., id, status, created_at
  id: number; // Based on your API output
  status?: string; // Example, if your API includes it
  created_at?: string; // Example, if your API includes it
  public: boolean; // 添加 public 属性，用于表示分享状态
}

// Update the return type interface to include refetch
interface UseCorrectionHistoryResult {
  history: CorrectionHistoryItem[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => Promise<void>; // Add refetch function
}

// Define the page size. This should match the default limit used in your API route
// If your API default is 7, use 7. If you want a different size, you can specify it
// and potentially pass it to the API call. Let's use 7 as per your API route default.
const PAGE_SIZE = 7;

export function useCorrectionHistory(): UseCorrectionHistoryResult {
  const [history, setHistory] = useState<CorrectionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  // Use 'page' to track the current page number for pagination
  const [page, setPage] = useState(0);

  // Wrap the fetch logic in a useCallback function
  const fetchHistory = useCallback(async (currentPage: number, append: boolean = false) => {
    setLoading(true);
    try {
      // Calculate skip based on the current page and page size
      const skip = currentPage * PAGE_SIZE;
      // Adjust the URL and parameters based on your API's pagination
      // Your API uses 'limit' and 'skip'
      const response = await fetch(`/api/correction/history?limit=${PAGE_SIZE}&skip=${skip}`);

      // Check for HTTP errors first
      if (!response.ok) {
          // Attempt to parse error message from body if available
          const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
      }

      // Assuming API returns { data: CorrectionHistoryItem[], message?: string }
      const result = await response.json();

      // Check if the expected properties exist in the successful response
      // We now only check if result exists and result.data is an array
      if (result && Array.isArray(result.data)) {
          const fetchedItems = result.data as CorrectionHistoryItem[]; // Cast for type safety

          if (append) {
              // Append new data from result.data
              setHistory(prev => [...prev, ...fetchedItems]);
          } else {
              // For refetch, replace the entire history with result.data
              setHistory(fetchedItems);
          }

          // Calculate hasMore: If the number of items fetched is less than the PAGE_SIZE,
          // it means there are no more items to load.
          setHasMore(fetchedItems.length === PAGE_SIZE);

          // Optional: Show a success toast only on the first load or refetch if needed
          // if (currentPage === 0 && !append) {
          //     toast.success("历史记录加载成功！");
          // }

      } else {
          // Response was OK (200), but the structure is unexpected
          console.error("API response structure unexpected:", result);
          toast.error(result.message || "Failed to parse history data: Unexpected structure.");
          setHasMore(false); // Stop loading more
      }

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to fetch history:", error);
            toast.error(error.message || "Failed to fetch history.");
        } else {
            console.error("Unexpected error:", error);
            toast.error("Failed to fetch history: Unknown error.");
        }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is stable

  // Initial fetch and subsequent fetches on page change
  useEffect(() => {
    // When page changes (via loadMore), we append new data
    // When page is 0 (initial load or refetch), we replace data
    // The append logic is handled inside fetchHistory now based on the 'append' parameter
    fetchHistory(page, page > 0); // Append only if page > 0
  }, [page, fetchHistory]); // Depend on page and the stable fetchHistory function

  // Function to trigger a full reload from the first page
  const refetch = useCallback(async () => {
      setPage(0); // Reset page to 0 for a full reload
      setHasMore(true); // Assume there might be more after refetch
      // The useEffect will trigger the fetch for page 0
  }, []); // No dependencies needed as it only updates state

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1); // Increment page to load the next set of results
    }
  }, [loading, hasMore]); // Depend on loading and hasMore


  return {
    history,
    loading,
    hasMore,
    loadMore,
    refetch, // Return the new refetch function
  };
}
