import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
    return (
        <nav
            aria-label="pagination"
            className={cn('mx-auto flex w-full justify-center', className)}
            {...props}
        />
    );
}

function PaginationContent({
    className,
    ...props
}: React.ComponentProps<'ul'>) {
    return (
        <ul
            className={cn('flex flex-row items-center gap-1', className)}
            {...props}
        />
    );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
    return <li {...props} />;
}

type PaginationLinkProps = {
    isActive?: boolean;
    icon?: LucideIcon;
} & React.ComponentProps<'a'>;

function PaginationLink({
    className,
    isActive,
    icon: Icon,
    children,
    ...props
}: PaginationLinkProps) {
    const hasContent = React.Children.count(children) > 0;

    return (
        <a
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                buttonVariants({
                    variant: isActive ? 'outline' : 'ghost',
                    size: Icon && !hasContent ? 'icon-sm' : 'sm',
                }),
                className,
            )}
            {...props}
        >
            {Icon && <Icon className="size-4" />}
            {children}
        </a>
    );
}

function PaginationPrevious({
    className,
    text = 'Previous',
    ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
    return (
        <PaginationLink
            aria-label="Go to previous page"
            className={cn('gap-1 pl-2.5', className)}
            icon={ChevronLeft}
            {...props}
        >
            <span className="hidden sm:block">{text}</span>
        </PaginationLink>
    );
}

function PaginationNext({
    className,
    text = 'Next',
    ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
    return (
        <PaginationLink
            aria-label="Go to next page"
            className={cn('gap-1 pr-2.5', className)}
            {...props}
        >
            <span className="hidden sm:block">{text}</span>
            <ChevronRight className="size-4" />
        </PaginationLink>
    );
}

function PaginationEllipsis({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    return (
        <span
            aria-hidden
            className={cn('flex size-8 items-center justify-center', className)}
            {...props}
        >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">More pages</span>
        </span>
    );
}

function PaginationButton({
    className,
    isActive,
    ...props
}: React.ComponentProps<typeof Button> & { isActive?: boolean }) {
    return (
        <Button
            variant={isActive ? 'outline' : 'ghost'}
            size="icon-sm"
            className={className}
            aria-current={isActive ? 'page' : undefined}
            {...props}
        />
    );
}

export {
    Pagination,
    PaginationButton,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
};
