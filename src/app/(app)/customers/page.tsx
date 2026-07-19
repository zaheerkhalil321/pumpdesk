import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { formatDate } from "@/lib/date";

import { Search } from "lucide-react";

import { CustomersHeader } from "@/features/customers/components/CustomersHeader";
import { getCustomers } from "@/features/customers/api/customers.api";

type Props = {
    searchParams: Promise<{
        filter?: "active" | "inactive" | "all";
    }>;
};

export default async function CustomersPage({
    searchParams,
}: Props) {
    const { filter = "active" } = await searchParams;

    const { data, error } = await getCustomers({
        active:
            filter === "all"
                ? undefined
                : filter === "active",
    });

    if (error) {
        return (
            <div className="text-destructive">
                Failed to load customers.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <CustomersHeader />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        placeholder="Search customers..."
                        className="pl-10"
                    />
                </div>

                <Tabs value={filter}>
                    <TabsList>
                        <TabsTrigger
                            value="active"
                            nativeButton={false}
                            render={<Link href="/customers" />}
                        >
                            Active
                        </TabsTrigger>

                        <TabsTrigger
                            value="inactive"
                            nativeButton={false}
                            render={
                                <Link href="/customers?filter=inactive" />
                            }
                        >
                            Inactive
                        </TabsTrigger>

                        <TabsTrigger
                            value="all"
                            nativeButton={false}
                            render={<Link href="/customers?filter=all" />}
                        >
                            All
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-3/4">Name</TableHead>
                                <TableHead className="w-1/4">Created</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {data?.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="w-3/4 p-0 font-medium">
                                        <Link
                                            href={`/customers/${customer.id}`}
                                            className="block px-4 py-3"
                                        >
                                            {customer.name}
                                        </Link>
                                    </TableCell>

                                    <TableCell className="w-1/4 whitespace-nowrap">
                                        {formatDate(customer.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}