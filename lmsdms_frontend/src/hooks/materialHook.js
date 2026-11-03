import { useState, useEffect, useCallback } from "react";
import apiService from "services/apiService";

const useSectionMaterials = (sectionID) => {
  const [materialItems, setMaterialItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMaterialSection = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.get(
        `/lms_module/training_section_wise_training_material`,
        {
          params: { section_id: sectionID },
        }
      );
      setMaterialItems(response?.data?.data?.materials || []);
    } catch (err) {
      console.error("Error fetching Material Data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sectionID]);

  // Fetch materials on mount or when sectionID changes
  useEffect(() => {
    if (sectionID) {
      fetchMaterialSection();
    }
  }, [sectionID, fetchMaterialSection]);

  return { materialItems, fetchMaterialSection, loading, error };
};

export default useSectionMaterials;
