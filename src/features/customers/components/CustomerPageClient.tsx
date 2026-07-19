"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { updateCustomer } from "@/features/customers/api/customers.api";

import {
    CustomerContactsTab,
    CustomerFilesTab,
    CustomerHeader,
    CustomerInvoicesTab,
    CustomerJobsTab,
    CustomerNotesTab,
    CustomerOverviewTab,
} from ".";

import { useRouter } from "next/navigation";

import type { Customer, CustomerFormData } from "../types";

type Props = {
    customer: Customer;
};

export function CustomerPageClient({ customer }: Props) {
    const router = useRouter();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState(createForm(customer));

    function handleEdit() {
        setEditing(true);
    }

    function handleCancel() {
        setForm(createForm(customer));
        setEditing(false);
    }

    function normalizeForm(
        form: CustomerFormData
    ): Partial<Customer> {
        return {
            ...form,

            office_phone: form.office_phone || null,

            address_1: form.address_1 || null,
            address_2: form.address_2 || null,
            city: form.city || null,
            state: form.state || null,
            zip: form.zip || null,

            billing_address_1:
                form.billing_address_1 || null,
            billing_address_2:
                form.billing_address_2 || null,
            billing_city:
                form.billing_city || null,
            billing_state:
                form.billing_state || null,
            billing_zip:
                form.billing_zip || null,

            notes: form.notes || null,
        };
    }

async function handleSave() {
    setSaving(true);

    try {
        const { error } = await updateCustomer(
            customer.id,
            normalizeForm(form)
        );

        if (error) {
            console.error(error);
            return;
        }

        setEditing(false);
        router.refresh();
    } catch (error) {
        console.error(error);
    } finally {
        setSaving(false);
    }
}

    function createForm(customer: Customer): CustomerFormData {
        return {
            name: customer.name,
            emails: customer.emails,

            office_phone: customer.office_phone ?? "",

            address_1: customer.address_1 ?? "",
            address_2: customer.address_2 ?? "",
            city: customer.city ?? "",
            state: customer.state ?? "",
            zip: customer.zip ?? "",

            billing_same_as_physical:
                customer.billing_same_as_physical,

            billing_address_1:
                customer.billing_address_1 ?? "",
            billing_address_2:
                customer.billing_address_2 ?? "",
            billing_city:
                customer.billing_city ?? "",
            billing_state:
                customer.billing_state ?? "",
            billing_zip:
                customer.billing_zip ?? "",

            notes: customer.notes ?? "",

            require_po: customer.require_po,
        };
    }

    return (
        <div className="space-y-8">
            <CustomerHeader
                customer={customer}
                editing={editing}
                saving={saving}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onSave={handleSave}
            />

            <Tabs
                defaultValue="overview"
                className="space-y-6"
            >
                <TabsList>
                    <TabsTrigger value="overview">
                        Overview
                    </TabsTrigger>

                    <TabsTrigger value="jobs">
                        Jobs
                    </TabsTrigger>

                    <TabsTrigger value="invoices">
                        Invoices
                    </TabsTrigger>

                    <TabsTrigger value="contacts">
                        Contacts
                    </TabsTrigger>

                    <TabsTrigger value="notes">
                        Notes
                    </TabsTrigger>

                    <TabsTrigger value="files">
                        Files
                    </TabsTrigger>
                </TabsList>

                <CustomerOverviewTab
                    customer={customer}
                    editing={editing}
                    form={form}
                    setForm={setForm}
                />

                <CustomerJobsTab />

                <CustomerInvoicesTab />

                <CustomerContactsTab />

                <CustomerNotesTab />

                <CustomerFilesTab />
            </Tabs>
        </div>
    );
}