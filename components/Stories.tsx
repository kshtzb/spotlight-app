import STORIES from "@/constants/mock-data";
import { styles } from "@/styles/feed.styles";
import { ScrollView } from "react-native";
import Story from "./Story";

const StoriesSection = () => {
  // Add this check
  if (!STORIES || !Array.isArray(STORIES)) {
    console.log("STORIES is not available:", STORIES);
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={styles.storiesContainer}
    >
      {STORIES.map((story) => (
        <Story key={story.id} story={story} />
      ))}
    </ScrollView>
  );
};

export default StoriesSection;
