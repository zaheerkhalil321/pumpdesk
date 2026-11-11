
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"changes": Json | null,"company_id": string,"created_at": string,"entity_id": string,"entity_type": string,"id": string,"summary": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"changes"?: Json | null,"company_id": string,"created_at"?: string,"entity_id": string,"entity_type": string,"id"?: string,"summary"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"changes"?: Json | null,"company_id"?: string,"created_at"?: string,"entity_id"?: string,"entity_type"?: string,"id"?: string,"summary"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_log_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"app_users": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"full_name": string | null,"id": string,"last_active_at": string | null,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string,"last_active_at"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string,"last_active_at"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"branches": {
                  Row: {
                    "address_line_1": string | null,"city": string | null,"code": string,"company_id": string,"created_at": string,"id": string,"is_active": boolean,"is_hq": boolean,"latitude": number | null,"longitude": number | null,"name": string,"phone": string | null,"postal_code": string | null,"state": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line_1"?: string | null,"city"?: string | null,"code": string,"company_id"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"is_hq"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"name": string,"phone"?: string | null,"postal_code"?: string | null,"state"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address_line_1"?: string | null,"city"?: string | null,"code"?: string,"company_id"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"is_hq"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"name"?: string,"phone"?: string | null,"postal_code"?: string | null,"state"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "branches_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"call_logs": {
                  Row: {
                    "company_id": string,"contact_id": string | null,"created_at": string,"customer_id": string | null,"employee_id": string | null,"error_code": string | null,"error_message": string | null,"from_phone": string,"id": string,"job_id": string | null,"placed_by": string | null,"provider_sid": string | null,"recipient_kind": string,"status": string,"to_phone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"contact_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"employee_id"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"from_phone": string,"id"?: string,"job_id"?: string | null,"placed_by"?: string | null,"provider_sid"?: string | null,"recipient_kind": string,"status": string,"to_phone": string
                  }
                  Update: {
                    "company_id"?: string,"contact_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"employee_id"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"from_phone"?: string,"id"?: string,"job_id"?: string | null,"placed_by"?: string | null,"provider_sid"?: string | null,"recipient_kind"?: string,"status"?: string,"to_phone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "call_logs_company_id_contact_id_fkey"
      columns: ["company_id","contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "call_logs_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "call_logs_company_id_employee_id_fkey"
      columns: ["company_id","employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "call_logs_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "call_logs_company_id_job_id_fkey"
      columns: ["company_id","job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "call_logs_placed_by_fkey"
      columns: ["placed_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "address_line_1": string | null,"address_line_2": string | null,"city": string | null,"country_code": string,"created_at": string,"currency": string,"display_name": string,"email": string | null,"id": string,"is_active": boolean,"legal_name": string,"logo_path": string | null,"logo_text": string | null,"phone": string | null,"postal_code": string | null,"slug": string,"state": string | null,"tax_id_last4": string | null,"timezone": string,"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line_1"?: string | null,"address_line_2"?: string | null,"city"?: string | null,"country_code"?: string,"created_at"?: string,"currency"?: string,"display_name": string,"email"?: string | null,"id"?: string,"is_active"?: boolean,"legal_name": string,"logo_path"?: string | null,"logo_text"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"slug": string,"state"?: string | null,"tax_id_last4"?: string | null,"timezone": string,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "address_line_1"?: string | null,"address_line_2"?: string | null,"city"?: string | null,"country_code"?: string,"created_at"?: string,"currency"?: string,"display_name"?: string,"email"?: string | null,"id"?: string,"is_active"?: boolean,"legal_name"?: string,"logo_path"?: string | null,"logo_text"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"slug"?: string,"state"?: string | null,"tax_id_last4"?: string | null,"timezone"?: string,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"company_memberships": {
                  Row: {
                    "company_id": string,"created_at": string,"id": string,"invited_at": string | null,"invited_by": string | null,"joined_at": string | null,"role": Database["public"]['Enums']["membership_role"],"status": Database["public"]['Enums']["membership_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"id"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"joined_at"?: string | null,"role": Database["public"]['Enums']["membership_role"],"status"?: Database["public"]['Enums']["membership_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"id"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"joined_at"?: string | null,"role"?: Database["public"]['Enums']["membership_role"],"status"?: Database["public"]['Enums']["membership_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_memberships_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_memberships_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    }
                  ]
                },"company_settings": {
                  Row: {
                    "accepted_payment_methods": string | null,"billing_email": string | null,"company_id": string,"default_cancellation_fee": number | null,"default_job_minutes": number,"default_minimum_hours": number,"default_tax_rate": number,"invoice_due_days": number,"remit_to": string | null,"require_operator_ticket_approval": boolean,"require_ticket_signature": boolean,"updated_at": string,"use_address_on_invoices": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_payment_methods"?: string | null,"billing_email"?: string | null,"company_id": string,"default_cancellation_fee"?: number | null,"default_job_minutes"?: number,"default_minimum_hours"?: number,"default_tax_rate"?: number,"invoice_due_days"?: number,"remit_to"?: string | null,"require_operator_ticket_approval"?: boolean,"require_ticket_signature"?: boolean,"updated_at"?: string,"use_address_on_invoices"?: boolean
                  }
                  Update: {
                    "accepted_payment_methods"?: string | null,"billing_email"?: string | null,"company_id"?: string,"default_cancellation_fee"?: number | null,"default_job_minutes"?: number,"default_minimum_hours"?: number,"default_tax_rate"?: number,"invoice_due_days"?: number,"remit_to"?: string | null,"require_operator_ticket_approval"?: boolean,"require_ticket_signature"?: boolean,"updated_at"?: string,"use_address_on_invoices"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_settings_company_id_fkey"
      columns: ["company_id"]
isOneToOne: true
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"concrete_suppliers": {
                  Row: {
                    "address_line_1": string | null,"city": string | null,"company_id": string,"created_at": string,"dispatch_phone": string | null,"email": string | null,"id": string,"is_active": boolean,"name": string,"notes": string | null,"phone": string | null,"postal_code": string | null,"state": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line_1"?: string | null,"city"?: string | null,"company_id"?: string,"created_at"?: string,"dispatch_phone"?: string | null,"email"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"notes"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"state"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address_line_1"?: string | null,"city"?: string | null,"company_id"?: string,"created_at"?: string,"dispatch_phone"?: string | null,"email"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"notes"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"state"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "concrete_suppliers_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"contacts": {
                  Row: {
                    "company_id": string,"created_at": string,"email": string | null,"first_name": string,"id": string,"is_active": boolean,"job_title": string | null,"last_name": string | null,"notes": string | null,"phone": string | null,"phone_type": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"created_at"?: string,"email"?: string | null,"first_name": string,"id"?: string,"is_active"?: boolean,"job_title"?: string | null,"last_name"?: string | null,"notes"?: string | null,"phone"?: string | null,"phone_type"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"email"?: string | null,"first_name"?: string,"id"?: string,"is_active"?: boolean,"job_title"?: string | null,"last_name"?: string | null,"notes"?: string | null,"phone"?: string | null,"phone_type"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contacts_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_contact_links": {
                  Row: {
                    "company_id": string,"contact_id": string,"created_at": string,"customer_id": string,"id": string,"is_primary": boolean,"receives_invoices": boolean,"receives_job_confirmations": boolean,"roles": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"contact_id": string,"created_at"?: string,"customer_id": string,"id"?: string,"is_primary"?: boolean,"receives_invoices"?: boolean,"receives_job_confirmations"?: boolean,"roles"?: (string)[]
                  }
                  Update: {
                    "company_id"?: string,"contact_id"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string,"is_primary"?: boolean,"receives_invoices"?: boolean,"receives_job_confirmations"?: boolean,"roles"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_contact_links_company_id_contact_id_fkey"
      columns: ["company_id","contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "customer_contact_links_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "customer_contact_links_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "billing_address_line_1": string | null,"billing_address_line_2": string | null,"billing_city": string | null,"billing_country_code": string,"billing_postal_code": string | null,"billing_state": string | null,"business_name": string,"company_id": string,"created_at": string,"credit_hold": boolean,"credit_limit": number | null,"customer_number": string | null,"customer_type": string | null,"dispatch_note": string | null,"email": string | null,"id": string,"internal_notes": string | null,"is_active": boolean,"legal_name": string | null,"payment_terms_days": number | null,"phone": string | null,"requires_po": boolean,"status": Database["public"]['Enums']["customer_status"],"tax_exempt": boolean,"tax_exempt_number": string | null,"tier": string | null,"updated_at": string,"version": number,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_address_line_1"?: string | null,"billing_address_line_2"?: string | null,"billing_city"?: string | null,"billing_country_code"?: string,"billing_postal_code"?: string | null,"billing_state"?: string | null,"business_name": string,"company_id"?: string,"created_at"?: string,"credit_hold"?: boolean,"credit_limit"?: number | null,"customer_number"?: string | null,"customer_type"?: string | null,"dispatch_note"?: string | null,"email"?: string | null,"id"?: string,"internal_notes"?: string | null,"is_active"?: boolean,"legal_name"?: string | null,"payment_terms_days"?: number | null,"phone"?: string | null,"requires_po"?: boolean,"status"?: Database["public"]['Enums']["customer_status"],"tax_exempt"?: boolean,"tax_exempt_number"?: string | null,"tier"?: string | null,"updated_at"?: string,"version"?: number,"website"?: string | null
                  }
                  Update: {
                    "billing_address_line_1"?: string | null,"billing_address_line_2"?: string | null,"billing_city"?: string | null,"billing_country_code"?: string,"billing_postal_code"?: string | null,"billing_state"?: string | null,"business_name"?: string,"company_id"?: string,"created_at"?: string,"credit_hold"?: boolean,"credit_limit"?: number | null,"customer_number"?: string | null,"customer_type"?: string | null,"dispatch_note"?: string | null,"email"?: string | null,"id"?: string,"internal_notes"?: string | null,"is_active"?: boolean,"legal_name"?: string | null,"payment_terms_days"?: number | null,"phone"?: string | null,"requires_po"?: boolean,"status"?: Database["public"]['Enums']["customer_status"],"tax_exempt"?: boolean,"tax_exempt_number"?: string | null,"tier"?: string | null,"updated_at"?: string,"version"?: number,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"document_sequences": {
                  Row: {
                    "company_id": string,"doc_type": Database["public"]['Enums']["doc_type"],"next_value": number,"prefix": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"doc_type": Database["public"]['Enums']["doc_type"],"next_value": number,"prefix": string
                  }
                  Update: {
                    "company_id"?: string,"doc_type"?: Database["public"]['Enums']["doc_type"],"next_value"?: number,"prefix"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "document_sequences_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"employees": {
                  Row: {
                    "branch_id": string | null,"cdl_class": string | null,"cdl_expires_on": string | null,"company_id": string,"created_at": string,"email": string | null,"employee_number": string | null,"first_name": string,"hire_date": string | null,"home_yard_id": string | null,"id": string,"is_dispatcher": boolean,"is_mechanic": boolean,"is_operator": boolean,"job_title": string | null,"last_name": string,"medical_cert_expires_on": string | null,"notes": string | null,"phone": string | null,"preferred_name": string | null,"status": Database["public"]['Enums']["employee_status"],"termination_date": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "branch_id"?: string | null,"cdl_class"?: string | null,"cdl_expires_on"?: string | null,"company_id"?: string,"created_at"?: string,"email"?: string | null,"employee_number"?: string | null,"first_name": string,"hire_date"?: string | null,"home_yard_id"?: string | null,"id"?: string,"is_dispatcher"?: boolean,"is_mechanic"?: boolean,"is_operator"?: boolean,"job_title"?: string | null,"last_name": string,"medical_cert_expires_on"?: string | null,"notes"?: string | null,"phone"?: string | null,"preferred_name"?: string | null,"status"?: Database["public"]['Enums']["employee_status"],"termination_date"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "branch_id"?: string | null,"cdl_class"?: string | null,"cdl_expires_on"?: string | null,"company_id"?: string,"created_at"?: string,"email"?: string | null,"employee_number"?: string | null,"first_name"?: string,"hire_date"?: string | null,"home_yard_id"?: string | null,"id"?: string,"is_dispatcher"?: boolean,"is_mechanic"?: boolean,"is_operator"?: boolean,"job_title"?: string | null,"last_name"?: string,"medical_cert_expires_on"?: string | null,"notes"?: string | null,"phone"?: string | null,"preferred_name"?: string | null,"status"?: Database["public"]['Enums']["employee_status"],"termination_date"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "employees_company_id_branch_id_fkey"
      columns: ["company_id","branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "employees_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employees_home_yard_fkey"
      columns: ["company_id","home_yard_id"]
isOneToOne: false
      referencedRelation: "yards"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "employees_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    }
                  ]
                },"equipment": {
                  Row: {
                    "available_again_on": string | null,"boom_length_m": number | null,"branch_id": string | null,"company_id": string,"created_at": string,"current_mileage": number | null,"default_operator_id": string | null,"engine_hours": number | null,"equipment_number": string,"horizontal_reach_ft": number | null,"hourly_rate_override": number | null,"id": string,"in_service_date": string | null,"is_active": boolean,"license_plate": string | null,"make": string | null,"min_hours_override": number | null,"model": string | null,"model_year": number | null,"next_inspection_due": string | null,"notes": string | null,"purchase_date": string | null,"retired_date": string | null,"serial_number": string | null,"status": Database["public"]['Enums']["equipment_status"],"type": Database["public"]['Enums']["equipment_type"],"updated_at": string,"vertical_reach_ft": number | null,"vin": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "available_again_on"?: string | null,"boom_length_m"?: number | null,"branch_id"?: string | null,"company_id"?: string,"created_at"?: string,"current_mileage"?: number | null,"default_operator_id"?: string | null,"engine_hours"?: number | null,"equipment_number": string,"horizontal_reach_ft"?: number | null,"hourly_rate_override"?: number | null,"id"?: string,"in_service_date"?: string | null,"is_active"?: boolean,"license_plate"?: string | null,"make"?: string | null,"min_hours_override"?: number | null,"model"?: string | null,"model_year"?: number | null,"next_inspection_due"?: string | null,"notes"?: string | null,"purchase_date"?: string | null,"retired_date"?: string | null,"serial_number"?: string | null,"status"?: Database["public"]['Enums']["equipment_status"],"type": Database["public"]['Enums']["equipment_type"],"updated_at"?: string,"vertical_reach_ft"?: number | null,"vin"?: string | null
                  }
                  Update: {
                    "available_again_on"?: string | null,"boom_length_m"?: number | null,"branch_id"?: string | null,"company_id"?: string,"created_at"?: string,"current_mileage"?: number | null,"default_operator_id"?: string | null,"engine_hours"?: number | null,"equipment_number"?: string,"horizontal_reach_ft"?: number | null,"hourly_rate_override"?: number | null,"id"?: string,"in_service_date"?: string | null,"is_active"?: boolean,"license_plate"?: string | null,"make"?: string | null,"min_hours_override"?: number | null,"model"?: string | null,"model_year"?: number | null,"next_inspection_due"?: string | null,"notes"?: string | null,"purchase_date"?: string | null,"retired_date"?: string | null,"serial_number"?: string | null,"status"?: Database["public"]['Enums']["equipment_status"],"type"?: Database["public"]['Enums']["equipment_type"],"updated_at"?: string,"vertical_reach_ft"?: number | null,"vin"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "equipment_company_id_branch_id_fkey"
      columns: ["company_id","branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "equipment_company_id_default_operator_id_fkey"
      columns: ["company_id","default_operator_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "equipment_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"job_contacts": {
                  Row: {
                    "company_id": string,"contact_id": string,"created_at": string,"id": string,"job_id": string,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string,"contact_id": string,"created_at"?: string,"id"?: string,"job_id": string,"role"?: string
                  }
                  Update: {
                    "company_id"?: string,"contact_id"?: string,"created_at"?: string,"id"?: string,"job_id"?: string,"role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_contacts_company_id_contact_id_fkey"
      columns: ["company_id","contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "job_contacts_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_contacts_company_id_job_id_fkey"
      columns: ["company_id","job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"job_employee_assignments": {
                  Row: {
                    "acknowledged_at": string | null,"assigned_at": string,"assigned_by": string | null,"assignment_type": Database["public"]['Enums']["assignment_type"],"company_id": string,"employee_id": string,"id": string,"job_id": string,"released_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "acknowledged_at"?: string | null,"assigned_at"?: string,"assigned_by"?: string | null,"assignment_type"?: Database["public"]['Enums']["assignment_type"],"company_id"?: string,"employee_id": string,"id"?: string,"job_id": string,"released_at"?: string | null
                  }
                  Update: {
                    "acknowledged_at"?: string | null,"assigned_at"?: string,"assigned_by"?: string | null,"assignment_type"?: Database["public"]['Enums']["assignment_type"],"company_id"?: string,"employee_id"?: string,"id"?: string,"job_id"?: string,"released_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_employee_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_employee_assignments_company_id_employee_id_fkey"
      columns: ["company_id","employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "job_employee_assignments_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_employee_assignments_company_id_job_id_fkey"
      columns: ["company_id","job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"job_equipment_assignments": {
                  Row: {
                    "assigned_at": string,"assigned_by": string | null,"company_id": string,"equipment_id": string,"id": string,"job_id": string,"released_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"company_id"?: string,"equipment_id": string,"id"?: string,"job_id": string,"released_at"?: string | null
                  }
                  Update: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"company_id"?: string,"equipment_id"?: string,"id"?: string,"job_id"?: string,"released_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_equipment_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_equipment_assignments_company_id_equipment_id_fkey"
      columns: ["company_id","equipment_id"]
isOneToOne: false
      referencedRelation: "equipment"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "job_equipment_assignments_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_equipment_assignments_company_id_job_id_fkey"
      columns: ["company_id","job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"job_sites": {
                  Row: {
                    "access_notes": string | null,"address_line_1": string | null,"address_line_2": string | null,"city": string,"company_id": string,"country_code": string,"created_at": string,"customer_id": string | null,"gate_code": string | null,"hazard_notes": string | null,"id": string,"is_active": boolean,"latitude": number | null,"longitude": number | null,"name": string | null,"postal_code": string | null,"setup_notes": string | null,"state": string,"timezone": string | null,"updated_at": string,"washout_notes": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "access_notes"?: string | null,"address_line_1"?: string | null,"address_line_2"?: string | null,"city": string,"company_id"?: string,"country_code"?: string,"created_at"?: string,"customer_id"?: string | null,"gate_code"?: string | null,"hazard_notes"?: string | null,"id"?: string,"is_active"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"name"?: string | null,"postal_code"?: string | null,"setup_notes"?: string | null,"state": string,"timezone"?: string | null,"updated_at"?: string,"washout_notes"?: string | null
                  }
                  Update: {
                    "access_notes"?: string | null,"address_line_1"?: string | null,"address_line_2"?: string | null,"city"?: string,"company_id"?: string,"country_code"?: string,"created_at"?: string,"customer_id"?: string | null,"gate_code"?: string | null,"hazard_notes"?: string | null,"id"?: string,"is_active"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"name"?: string | null,"postal_code"?: string | null,"setup_notes"?: string | null,"state"?: string,"timezone"?: string | null,"updated_at"?: string,"washout_notes"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_sites_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "job_sites_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"job_status_history": {
                  Row: {
                    "changed_at": string,"changed_by": string | null,"company_id": string,"dimension": string,"id": string,"job_id": string,"new_value": string,"old_value": string | null,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"changed_by"?: string | null,"company_id"?: string,"dimension": string,"id"?: string,"job_id": string,"new_value": string,"old_value"?: string | null,"reason"?: string | null
                  }
                  Update: {
                    "changed_at"?: string,"changed_by"?: string | null,"company_id"?: string,"dimension"?: string,"id"?: string,"job_id"?: string,"new_value"?: string,"old_value"?: string | null,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_status_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_status_history_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_status_history_company_id_job_id_fkey"
      columns: ["company_id","job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["company_id","id"]
    }
                  ]
                },"jobs": {
                  Row: {
                    "arrive_by": string | null,"billing_service": string | null,"booking_status": Database["public"]['Enums']["booking_status"],"cancellation_reason": string | null,"cancelled_at": string | null,"cleanup_minutes": number,"collect_on_delivery": boolean,"company_id": string,"completed_at": string | null,"confirmed_at": string | null,"created_at": string,"created_by": string | null,"customer_id": string,"customer_notes": string | null,"dispatch_status": Database["public"]['Enums']["dispatch_status"],"dispatched_at": string | null,"estimated_yards": number,"extra_items": NonNullable<Json>,"field_status": Database["public"]['Enums']["field_status"],"id": string,"internal_note": string | null,"job_name": string | null,"job_number": string,"job_site_id": string | null,"lines_on_site": boolean,"linked_to_previous": boolean,"max_pump_size": string | null,"min_pump_size": string | null,"pour_type": string | null,"prep_minutes": number,"priority": Database["public"]['Enums']["job_priority"],"pump_minutes": number,"purchase_order_number": string | null,"scheduled_end": string,"scheduled_start": string,"service_date": string,"site_instructions": string | null,"site_label": string,"supplier_name": string | null,"timezone": string,"travel_minutes": number,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "arrive_by"?: string | null,"billing_service"?: string | null,"booking_status"?: Database["public"]['Enums']["booking_status"],"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"cleanup_minutes"?: number,"collect_on_delivery"?: boolean,"company_id"?: string,"completed_at"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id": string,"customer_notes"?: string | null,"dispatch_status"?: Database["public"]['Enums']["dispatch_status"],"dispatched_at"?: string | null,"estimated_yards": number,"extra_items"?: NonNullable<Json>,"field_status"?: Database["public"]['Enums']["field_status"],"id"?: string,"internal_note"?: string | null,"job_name"?: string | null,"job_number": string,"job_site_id"?: string | null,"lines_on_site"?: boolean,"linked_to_previous"?: boolean,"max_pump_size"?: string | null,"min_pump_size"?: string | null,"pour_type"?: string | null,"prep_minutes"?: number,"priority"?: Database["public"]['Enums']["job_priority"],"pump_minutes"?: number,"purchase_order_number"?: string | null,"scheduled_end": string,"scheduled_start": string,"service_date": string,"site_instructions"?: string | null,"site_label": string,"supplier_name"?: string | null,"timezone": string,"travel_minutes"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "arrive_by"?: string | null,"billing_service"?: string | null,"booking_status"?: Database["public"]['Enums']["booking_status"],"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"cleanup_minutes"?: number,"collect_on_delivery"?: boolean,"company_id"?: string,"completed_at"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string,"customer_notes"?: string | null,"dispatch_status"?: Database["public"]['Enums']["dispatch_status"],"dispatched_at"?: string | null,"estimated_yards"?: number,"extra_items"?: NonNullable<Json>,"field_status"?: Database["public"]['Enums']["field_status"],"id"?: string,"internal_note"?: string | null,"job_name"?: string | null,"job_number"?: string,"job_site_id"?: string | null,"lines_on_site"?: boolean,"linked_to_previous"?: boolean,"max_pump_size"?: string | null,"min_pump_size"?: string | null,"pour_type"?: string | null,"prep_minutes"?: number,"priority"?: Database["public"]['Enums']["job_priority"],"pump_minutes"?: number,"purchase_order_number"?: string | null,"scheduled_end"?: string,"scheduled_start"?: string,"service_date"?: string,"site_instructions"?: string | null,"site_label"?: string,"supplier_name"?: string | null,"timezone"?: string,"travel_minutes"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "jobs_company_id_customer_id_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "jobs_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jobs_company_id_job_site_id_fkey"
      columns: ["company_id","job_site_id"]
isOneToOne: false
      referencedRelation: "job_sites"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "jobs_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jobs_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    }
                  ]
                },"sms_messages": {
                  Row: {
                    "body": string,"company_id": string,"contact_id": string | null,"created_at": string,"customer_id": string | null,"employee_id": string | null,"error_code": string | null,"error_message": string | null,"id": string,"job_id": string | null,"provider_sid": string | null,"recipient_kind": string,"sent_by": string | null,"status": string,"to_phone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"company_id"?: string,"contact_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"employee_id"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"job_id"?: string | null,"provider_sid"?: string | null,"recipient_kind": string,"sent_by"?: string | null,"status": string,"to_phone": string
                  }
                  Update: {
                    "body"?: string,"company_id"?: string,"contact_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"employee_id"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"job_id"?: string | null,"provider_sid"?: string | null,"recipient_kind"?: string,"sent_by"?: string | null,"status"?: string,"to_phone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sms_messages_company_id_contact_id_fkey"
      columns: ["company_id","contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "sms_messages_company_id_employee_id_fkey"
      columns: ["company_id","employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "sms_messages_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sms_messages_company_id_job_id_fkey"
      columns: ["company_id","job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "sms_messages_customer_fkey"
      columns: ["company_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "sms_messages_sent_by_fkey"
      columns: ["sent_by"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    }
                  ]
                },"yards": {
                  Row: {
                    "address": string,"branch_id": string | null,"company_id": string,"created_at": string,"id": string,"is_active": boolean,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"branch_id"?: string | null,"company_id"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string,"branch_id"?: string | null,"company_id"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "yards_company_id_branch_id_fkey"
      columns: ["company_id","branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["company_id","id"]
    },{
      foreignKeyName: "yards_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "book_job":
{ Args: { "p": Json }; Returns: Json
                           },
"cancel_job":
{ Args: { "p_job": string,"p_reason": string,"p_version": number }; Returns: Json
                           },
"delete_operator":
{ Args: { "p_id": string }; Returns: undefined
                           },
"update_job":
{ Args: { "p": Json }; Returns: Json
                           }
          }
          Enums: {
            "assignment_type": "primary_operator"|"second_operator"|"helper","booking_status": "pending"|"confirmed"|"cancelled"|"no_show"|"inspection_pending"|"turned_in"|"reviewed","customer_status": "lead"|"active"|"inactive"|"blocked","dispatch_status": "unassigned"|"assigned"|"dispatched"|"acknowledged","doc_type": "job"|"ticket"|"invoice"|"work_order","employee_status": "active"|"inactive"|"leave"|"terminated","equipment_status": "available"|"maintenance"|"out_of_service"|"retired","equipment_type": "boom_pump"|"line_pump"|"trailer_pump"|"placing_boom"|"service_truck"|"support_vehicle"|"other","field_status": "scheduled"|"en_route"|"on_site"|"pumping"|"washout"|"returning"|"done","job_priority": "low"|"normal"|"high"|"urgent","membership_role": "owner"|"admin"|"dispatcher"|"office"|"operator"|"mechanic"|"accountant"|"read_only","membership_status": "invited"|"active"|"suspended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "assignment_type": ["primary_operator", "second_operator", "helper"],"booking_status": ["pending", "confirmed", "cancelled", "no_show", "inspection_pending", "turned_in", "reviewed"],"customer_status": ["lead", "active", "inactive", "blocked"],"dispatch_status": ["unassigned", "assigned", "dispatched", "acknowledged"],"doc_type": ["job", "ticket", "invoice", "work_order"],"employee_status": ["active", "inactive", "leave", "terminated"],"equipment_status": ["available", "maintenance", "out_of_service", "retired"],"equipment_type": ["boom_pump", "line_pump", "trailer_pump", "placing_boom", "service_truck", "support_vehicle", "other"],"field_status": ["scheduled", "en_route", "on_site", "pumping", "washout", "returning", "done"],"job_priority": ["low", "normal", "high", "urgent"],"membership_role": ["owner", "admin", "dispatcher", "office", "operator", "mechanic", "accountant", "read_only"],"membership_status": ["invited", "active", "suspended"]
          }
        }
} as const
