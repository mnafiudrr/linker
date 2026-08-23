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

export type SidebarSharedFolder = {
  id: string;
  name: string;
  token: string;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
      {children}
    </p>
  );
}

export function FolderTree({
  folders,
  shared,
}: {
  folders: SidebarFolder[];
  shared?: SidebarSharedFolder[];
}) {
  const tree = buildTree(folders);

  return (
    <nav aria-label="Folders" className="flex flex-col">
      {/* Pinned root entry */}
      <ul>
        <li>
          <RootEntry />
        </li>
      </ul>

      {tree.length === 0 ? (
        <p className="px-2 py-2 text-xs text-content-muted">No folders yet.</p>
      ) : (
        <ul className="mt-1">
          {tree.map((node) => (
            <TreeItem key={node.id} node={node} depth={0} />
          ))}
        </ul>
      )}

      {shared && shared.length > 0 ? (
        <>
          <SectionLabel>Shared</SectionLabel>
          <ul>
            {shared.map((entry) => (
              <li key={entry.id}>
                <SharedEntry shared={entry} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </nav>
  );
}

function RootEntry() {
  const pathname = usePathname();
  const isActive = pathname === "/dashboard";
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium",
        isActive ? "bg-primary-100 text-on-primary" : "hover:bg-base",
      )}
    >
      🏠 My links
    </Link>
  );
}

function SharedEntry({ shared }: { shared: SidebarSharedFolder }) {
  const pathname = usePathname();
  const isActive = pathname === `/dashboard/folder/${shared.id}`;
  return (
    <Link
      href={`/dashboard/folder/${shared.id}`}
      title={`Publicly shared (${shared.token})`}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
        isActive ? "bg-primary-100 text-on-primary" : "hover:bg-base",
      )}
    >
      <span aria-hidden="true" className="text-accent-peach">
        🔗
      </span>
      <span className="truncate">{shared.name}</span>
    </Link>
  );
}
