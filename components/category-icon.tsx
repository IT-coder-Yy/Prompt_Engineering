import Folder from "reicon-react/icons/Folder";
import Pen from "reicon-react/icons/Pen";
import Chat from "reicon-react/icons/Chat";
import Bag from "reicon-react/icons/Bag";
import Users from "reicon-react/icons/Users";
import Code from "reicon-react/icons/Code";

const icons: Record<string, typeof Folder> = { 办公: Folder, 内容运营: Pen, 客户服务: Chat, 电商销售: Bag, 招聘人事: Users, 研发数据: Code };

export function CategoryIcon({ category, size = 24 }: { category: string; size?: number }) {
  const Icon = icons[category] ?? Folder;
  return <Icon size={size} aria-hidden="true" />;
}
