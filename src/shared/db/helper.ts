import { manageLocalStoreSpace } from "../../background/services/data";

const DEFAULT_CUTOFF_DAYS = 60;

export const handleClearTimeLineData = async () => {
  return await manageLocalStoreSpace(DEFAULT_CUTOFF_DAYS)
};