'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

// Updated interface based on the provided structure
interface CriteriaDetail {
  comment: string;
  rating: string;
}

interface EvaluationResult {
  relevance: string;
  details: {
    strengths: string;
    weaknesses: string;
    suggestions: string;
  };
  criteria: {
    style: CriteriaDetail;
    color: CriteriaDetail;
    fit: CriteriaDetail;
    aesthetic: CriteriaDetail;
    beauty: CriteriaDetail;
    attractiveness: CriteriaDetail;
    impressiveness: CriteriaDetail;
  };
  elements: {
    [key: string]: string; // Assuming all elements are string values
  };
}

interface EvaluationApiResponse {
  status: string;
  message: string;
  result: EvaluationResult;
  cacheTime?: number; // Optional fields
  metadata?: any;     // Optional fields
}

export default function EvaluationModal({ isOpen, onClose, imageUrl }: EvaluationModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EvaluationApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && imageUrl) {
      const callApi = async () => {
        setLoading(true);
        setData(null);
        setError(null);
        console.log(`Evaluating image: ${imageUrl}`);

        const encodedImageUrl = encodeURIComponent(imageUrl);
        const url = `https://fashion-analysis-ai-trend-insights-style-reviews.p.rapidapi.com/?imageUrl=${encodedImageUrl}&noqueue=1&get=check`;
        const options: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-rapidapi-host': 'fashion-analysis-ai-trend-insights-style-reviews.p.rapidapi.com',
            'x-rapidapi-key': '1ef6fb8153msh6bd32418a554c3cp1f698cjsn43c78b243376' // WARNING: Use environment variables
          }
        };

        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          const result: EvaluationApiResponse = await response.json(); // Expect the new structure
          console.log('Evaluation API Response:', result);
          if (result.status !== 'success') {
            throw new Error(result.message || 'API returned a non-success status.');
          }
          setData(result);
        } catch (e: any) {
          console.error('Evaluation API Call Error:', e);
          setError(e.message || 'An error occurred while fetching evaluation data.');
        } finally {
          setLoading(false);
        }
      };

      callApi();
    }
  }, [isOpen, imageUrl]);

  const handleClose = () => {
    setData(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  // Helper function to render criteria items
  const renderCriteria = (name: string, criteria: CriteriaDetail) => (
    <div key={name} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0">
      <h4 className="text-lg font-medium capitalize text-gray-700">{name}</h4>
      <p className="text-sm text-gray-600 mt-1">{criteria.comment}</p>
      <p className="text-sm font-semibold text-indigo-600">Rating: {criteria.rating}</p>
    </div>
  );

  // Helper function to render element items
  const renderElement = (name: string, description: string) => (
    <div key={name} className="mb-2">
      <span className="font-medium capitalize text-gray-700">{name.replace('_', ' ')}:</span>
      <span className="text-sm text-gray-600 ml-2">{description}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[90vw] w-full bg-white sm:max-w-[80vw] lg:max-w-[1200px] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold mb-4">Image Evaluation Result</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 mr-2 animate-spin text-black" />
              <p className="text-lg text-gray-600">Evaluating...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {data?.result && !loading && (
            <div className="mt-4 space-y-5">
              {/* General Relevance */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Relevance</h3>
                <p className="text-sm text-gray-600">{data.result.relevance}</p>
              </div>

              {/* Details Section */}
              {data.result.details && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Details</h3>
                  <div className="pl-4 border-l-2 border-indigo-200 space-y-2">
                    <p><strong className="text-green-600">Strengths:</strong> <span className="text-sm text-gray-600">{data.result.details.strengths}</span></p>
                    <p><strong className="text-orange-600">Weaknesses:</strong> <span className="text-sm text-gray-600">{data.result.details.weaknesses}</span></p>
                    <p><strong className="text-blue-600">Suggestions:</strong> <span className="text-sm text-gray-600">{data.result.details.suggestions}</span></p>
                  </div>
                </div>
              )}

              {/* Criteria Section */}
              {data.result.criteria && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Criteria Analysis</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    {Object.entries(data.result.criteria).map(([key, value]) => renderCriteria(key, value))}
                  </div>
                </div>
              )}

              {/* Elements Section */}
              {data.result.elements && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Outfit Elements</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-1">
                    {Object.entries(data.result.elements).map(([key, value]) => renderElement(key, value))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && !data?.result && imageUrl && (
            <p className="text-gray-500 mt-4">Waiting for evaluation results...</p>
          )}
          {!loading && !error && !data && !imageUrl && (
            <p className="text-gray-500 mt-4">No image URL provided for evaluation.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 