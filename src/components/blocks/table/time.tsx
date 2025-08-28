import dayjs from "@/lib/dayjs";

export default function TableItemTime({
  value,
  options,
  className,
}: {
  value: number;
  options?: any;
  className?: string;
}) {
  return (
    <div className={className}>
      {options?.format
        ? dayjs(value).format(options?.format)
        : dayjs(value).fromNow()}
    </div>
  );
}
