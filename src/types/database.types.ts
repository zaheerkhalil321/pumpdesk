
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
                    "branch_id": string | null,"cdl_class": string | null,"cdl_expires_on": string | null,"company_id": string,"created_at": string,"email": string | null,"employee_number": string | null,"first_name": string,"hire_date": string | null,"id": string,"is_dispatcher": boolean,"is_mechanic": boolean,"is_operator": boolean,"job_title": string | null,"last_name": string,"medical_cert_expires_on": string | null,"notes": string | null,"phone": string | null,"preferred_name": string | null,"status": Database["public"]['Enums']["employee_status"],"termination_date": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "branch_id"?: string | null,"cdl_class"?: string | null,"cdl_expires_on"?: string | null,"company_id"?: string,"created_at"?: string,"email"?: string | null,"employee_number"?: string | null,"first_name": string,"hire_date"?: string | null,"id"?: string,"is_dispatcher"?: boolean,"is_mechanic"?: boolean,"is_operator"?: boolean,"job_title"?: string | null,"last_name": string,"medical_cert_expires_on"?: string | null,"notes"?: string | null,"phone"?: string | null,"preferred_name"?: string | null,"status"?: Database["public"]['Enums']["employee_status"],"termination_date"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "branch_id"?: string | null,"cdl_class"?: string | null,"cdl_expires_on"?: string | null,"company_id"?: string,"created_at"?: string,"email"?: string | null,"employee_number"?: string | null,"first_name"?: string,"hire_date"?: string | null,"id"?: string,"is_dispatcher"?: boolean,"is_mechanic"?: boolean,"is_operator"?: boolean,"job_title"?: string | null,"last_name"?: string,"medical_cert_expires_on"?: string | null,"notes"?: string | null,"phone"?: string | null,"preferred_name"?: string | null,"status"?: Database["public"]['Enums']["employee_status"],"termination_date"?: string | null,"updated_at"?: string,"user_id"?: string | null
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
      foreignKeyName: "employees_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "app_users"
      referencedColumns: ["id"]
    }
                  ]
                },"equipment": {
                  Row: {
                    "boom_length_m": number | null,"branch_id": string | null,"company_id": string,"created_at": string,"current_mileage": number | null,"default_operator_id": string | null,"engine_hours": number | null,"equipment_number": string,"horizontal_reach_ft": number | null,"hourly_rate_override": number | null,"id": string,"in_service_date": string | null,"is_active": boolean,"license_plate": string | null,"make": string | null,"min_hours_override": number | null,"model": string | null,"model_year": number | null,"next_inspection_due": string | null,"notes": string | null,"purchase_date": string | null,"retired_date": string | null,"serial_number": string | null,"status": Database["public"]['Enums']["equipment_status"],"type": Database["public"]['Enums']["equipment_type"],"updated_at": string,"vertical_reach_ft": number | null,"vin": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "boom_length_m"?: number | null,"branch_id"?: string | null,"company_id"?: string,"created_at"?: string,"current_mileage"?: number | null,"default_operator_id"?: string | null,"engine_hours"?: number | null,"equipment_number": string,"horizontal_reach_ft"?: number | null,"hourly_rate_override"?: number | null,"id"?: string,"in_service_date"?: string | null,"is_active"?: boolean,"license_plate"?: string | null,"make"?: string | null,"min_hours_override"?: number | null,"model"?: string | null,"model_year"?: number | null,"next_inspection_due"?: string | null,"notes"?: string | null,"purchase_date"?: string | null,"retired_date"?: string | null,"serial_number"?: string | null,"status"?: Database["public"]['Enums']["equipment_status"],"type": Database["public"]['Enums']["equipment_type"],"updated_at"?: string,"vertical_reach_ft"?: number | null,"vin"?: string | null
                  }
                  Update: {
                    "boom_length_m"?: number | null,"branch_id"?: string | null,"company_id"?: string,"created_at"?: string,"current_mileage"?: number | null,"default_operator_id"?: string | null,"engine_hours"?: number | null,"equipment_number"?: string,"horizontal_reach_ft"?: number | null,"hourly_rate_override"?: number | null,"id"?: string,"in_service_date"?: string | null,"is_active"?: boolean,"license_plate"?: string | null,"make"?: string | null,"min_hours_override"?: number | null,"model"?: string | null,"model_year"?: number | null,"next_inspection_due"?: string | null,"notes"?: string | null,"purchase_date"?: string | null,"retired_date"?: string | null,"serial_number"?: string | null,"status"?: Database["public"]['Enums']["equipment_status"],"type"?: Database["public"]['Enums']["equipment_type"],"updated_at"?: string,"vertical_reach_ft"?: number | null,"vin"?: string | null
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
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "customer_status": "lead"|"active"|"inactive"|"blocked","doc_type": "job"|"ticket"|"invoice"|"work_order","employee_status": "active"|"inactive"|"leave"|"terminated","equipment_status": "available"|"maintenance"|"out_of_service"|"retired","equipment_type": "boom_pump"|"line_pump"|"trailer_pump"|"placing_boom"|"service_truck"|"support_vehicle"|"other","membership_role": "owner"|"admin"|"dispatcher"|"office"|"operator"|"mechanic"|"accountant"|"read_only","membership_status": "invited"|"active"|"suspended"
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
            "customer_status": ["lead", "active", "inactive", "blocked"],"doc_type": ["job", "ticket", "invoice", "work_order"],"employee_status": ["active", "inactive", "leave", "terminated"],"equipment_status": ["available", "maintenance", "out_of_service", "retired"],"equipment_type": ["boom_pump", "line_pump", "trailer_pump", "placing_boom", "service_truck", "support_vehicle", "other"],"membership_role": ["owner", "admin", "dispatcher", "office", "operator", "mechanic", "accountant", "read_only"],"membership_status": ["invited", "active", "suspended"]
          }
        }
} as const
