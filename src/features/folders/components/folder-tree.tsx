"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type SidebarFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

type TreeNode = SidebarFolder & { children: TreeNode[] };

function buildTree(folders: SidebarFolder[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(folders.map((f) => [f.id, { ...f, children: [] }]));
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sortRecursive = (items: TreeNode[]) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) sortRecursive(item.children);
  };
  sortRecursive(roots);
  return roots;
}

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  const hasChildren = node.children.length > 0;
  const href = `/dashboard/folder/${node.id}`;
  const isActive = pathname === href;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center rounded-lg pr-1 text-sm",
          isActive ? "bg-primary-100 text-on-primary" : "hover:bg-base",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-transform",
              expanded && "rotate-90",
            )}
          >
            ▸
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Link href={href} className="flex-1 truncate py-1.5">
          {node.name}
        </Link>
      </div>
      {hasChildren && expanded ? (
        <ul>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FolderTree({
  folders,
}: {
  folders: SidebarFolder[];
}) {
  const tree = buildTree(folders);

  return (
    <nav aria-label="Folders" className="flex flex-col gap-2">
      {tree.length === 0 ? (
        <p className="px-2 py-4 text-xs text-content-muted">No folders yet.</p>
      ) : (
        <ul>
          {tree.map((node) => (
            <TreeItem key={node.id} node={node} depth={0} />
          ))}
        </ul>
      )}
    </nav>
  );
}
