import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getUsers } from "@/models/user";
import moment from "moment";
import Image from "next/image";

async function AdminUsersPage() {
  const users = await getUsers(1, 50);

  const columns: TableColumn[] = [
    { name: "uuid", title: "UUID" },
    { name: "email", title: "Email" },
    { name: "nickname", title: "Name" },
    {
      name: "avatar_url",
      title: "Avatar",
      callback: (row) => (
        <Image 
          src={row.avatar_url} 
          alt={`Avatar of ${row.nickname || row.email}`}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover" 
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBZWVZbAnoCR1xzFTlTEqabgDbvhLnbVA/wGFyVccRRdTCqQjwTKLOZ+KZOjLb8Y2IVHWcNgF0eF8pX4pzwRLfvTOdCe7N5YYUNAhhJKyT6JYgKdREGODdxHvGqVxOdAl3JjYkOvHKe4VlQ1bwPOmDEwGbLt5+5LnKWoqyZbD0nMXpvKGvHpV78Q7f6Jb6nHZuLe/HcJoB2b5SgZDRbgkaSJAYVhWTMILI/wBA6ZNGBs4qOTKW8e8Q6SLzWRgHbK2AqHHlELCW/bH2pLXdEZ/+k9zPP/v//Z"
        />
      ),
    },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: "All Users",
    columns,
    data: users,
  };

  return <TableSlot {...table} />;
}

AdminUsersPage.displayName = "AdminUsersPage";
export default AdminUsersPage;
