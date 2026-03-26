import { View, Text, Image } from "react-native";
import { styles } from "@/styles/feed.styles";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  content: string;
  _creationTime: number;
  user: {
    fullName: string;
    image: string;
  };
}

export default function Comment({ c }: { c: Comment }) {
  return (
    <View style={styles.commentContainer}>
      <Image source={{ uri: c.user.image }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>{c.user.fullName}</Text>
        <Text style={styles.commentText}>{c.content}</Text>
        <Text style={styles.commentTime}>
          {formatDistanceToNow(c._creationTime, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
}
