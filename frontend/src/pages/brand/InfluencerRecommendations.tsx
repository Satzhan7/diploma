import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { matchingService, Recommendation } from '../../services/matching';
import { InfluencerCard } from '../../components/InfluencerCard';
import { FilterSection } from '../../components/FilterSection';
import { RangeFilter } from '../../components/RangeFilter';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

// Placeholder for missing categories data
const categories = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Lifestyle'];

const InfluencerRecommendations = () => {
  const { user } = useAuth(); // Get current user (assuming it's a brand)
  const [filters, setFilters] = useState({}); // Placeholder for filters

  // Placeholder handler functions
  const handleCategoryFilter = (selectedCategories: string[]) => {
    console.log('Category filter:', selectedCategories);
    // TODO: Update filters state
  };
  const handleEngagementFilter = (value: number | number[]) => {
    console.log('Engagement filter:', value);
    // TODO: Update filters state
  };
  const handleSelectInfluencer = (influencerId: string) => {
    console.log('Selected influencer:', influencerId);
    // TODO: Implement selection logic (e.g., view profile, send request)
  };

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations', user?.id, filters], // Include user ID and filters in query key
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]); // Don't fetch if no user ID
      return matchingService.getRecommendations(user.id, 'influencers');
    },
    enabled: !!user?.id, // Only run query if user ID exists
  });

  return (
    <div className="recommendations-container">
      <h2>Рекомендуемые инфлюенсеры</h2>
      <div className="filters">
        <FilterSection 
          title="Категории"
          options={categories}
          onSelect={handleCategoryFilter}
        />
        <RangeFilter
          title="Уровень вовлеченности"
          min={0}
          max={20}
          onChange={handleEngagementFilter}
        />
      </div>
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="recommendations-grid">
          {recommendations?.map((influencerRec: Recommendation) => (
            <InfluencerCard 
              key={influencerRec.user.id}
              influencer={influencerRec.user}
              onSelect={() => handleSelectInfluencer(influencerRec.user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InfluencerRecommendations; 