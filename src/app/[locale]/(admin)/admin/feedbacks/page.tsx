import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getFeedbacks } from "@/models/feedback";
import dayjs from "@/lib/dayjs";
import Image from "next/image";

async function AdminFeedbacksPage() {
  const feedbacks = await getFeedbacks(1, 50);

  const columns: TableColumn[] = [
    {
      title: "User",
      name: "user",
      callback: (row) => {
        if (!row.user || !row.user.avatar_url) {
          return "-";
        }

        return (
          <div className="flex items-center gap-2">
            <Image
              src={row.user?.avatar_url || ""}
              alt={`${row.user?.nickname || 'User'} avatar`}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBZWVZbAnoCR1xzFTlTEqabgDbvhLnbVA/wGFyVccRRdTCqQjwTKLOZ+KZOjLb8Y2IVHWcNgF0eF8pX4pzwRLfvTOdCe7N5YYUNAhhJKyT6JYgKdREGODdxHvGqVxOdAl3JjYkOvHKe4VlQ1bwPOmDEwGbLt5+5LnKWoqyZbD0nMXpvKGvHpV78Q7f6Jb6nHZuLe/HcJoB2b5SgZDRbgkaSJAYVhWTMILI/wBA6ZNGBs4qOTKW8e8Q6SLzWRgHbK2AqHHlELCW/bH2pLXdEZ/+k9zPP/v//Z"
            />
            <span>{row.user?.nickname}</span>
          </div>
        );
      },
    },
    {
      name: "content",
      title: "Content",
      callback: (row) => row.content,
    },
    {
      name: "rating",
      title: "Rating",
      callback: (row) => row.rating,
    },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      name: "actions",
      title: "Actions",
      callback: (row) => (
        <a href={`/admin/users?user_uuid=${row.user_uuid}`} target="_blank">
          View user
        </a>
      ),
    },
  ];

  const table: TableSlotType = {
    title: "Feedbacks",
    columns,
    data: feedbacks,
  };

  return <TableSlot {...table} />;
}

AdminFeedbacksPage.displayName = 'AdminFeedbacksPage';

export default AdminFeedbacksPage;
