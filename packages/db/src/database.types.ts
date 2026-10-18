
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
            "adapter_runs": {
                  Row: {
                    "error": string | null,"finished_at": string | null,"id": string,"mode": string,"records_ok": number | null,"records_rejected": number | null,"source_id": string,"started_at": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "error"?: string | null,"finished_at"?: string | null,"id"?: string,"mode": string,"records_ok"?: number | null,"records_rejected"?: number | null,"source_id": string,"started_at"?: string,"status"?: string
                  }
                  Update: {
                    "error"?: string | null,"finished_at"?: string | null,"id"?: string,"mode"?: string,"records_ok"?: number | null,"records_rejected"?: number | null,"source_id"?: string,"started_at"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "adapter_runs_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"alerts": {
                  Row: {
                    "active": boolean,"channel": string,"created_at": string,"created_by": string | null,"id": string,"org_id": string,"rule": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"channel": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"org_id": string,"rule": NonNullable<Json>
                  }
                  Update: {
                    "active"?: boolean,"channel"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"org_id"?: string,"rule"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "alerts_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"calculations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"formula_version": string,"id": string,"input": NonNullable<Json>,"listing_product_id": string | null,"org_id": string,"result": NonNullable<Json>,"source_product_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"formula_version": string,"id"?: string,"input": NonNullable<Json>,"listing_product_id"?: string | null,"org_id": string,"result": NonNullable<Json>,"source_product_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"formula_version"?: string,"id"?: string,"input"?: NonNullable<Json>,"listing_product_id"?: string | null,"org_id"?: string,"result"?: NonNullable<Json>,"source_product_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "calculations_listing_product_id_fkey"
      columns: ["listing_product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calculations_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calculations_source_product_id_fkey"
      columns: ["source_product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"cargo_rates": {
                  Row: {
                    "basis": string,"carrier": string,"currency": string,"delivery_method": string,"fetched_at": string,"id": string,"rate": number,"route": string,"source_url": string | null,"status": string,"valid_from": string,"valid_to": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "basis": string,"carrier": string,"currency": string,"delivery_method": string,"fetched_at": string,"id"?: string,"rate": number,"route": string,"source_url"?: string | null,"status": string,"valid_from": string,"valid_to"?: string | null
                  }
                  Update: {
                    "basis"?: string,"carrier"?: string,"currency"?: string,"delivery_method"?: string,"fetched_at"?: string,"id"?: string,"rate"?: number,"route"?: string,"source_url"?: string | null,"status"?: string,"valid_from"?: string,"valid_to"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "external_id": string | null,"id": string,"marketplace_id": string | null,"name": string,"parent_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "external_id"?: string | null,"id"?: string,"marketplace_id"?: string | null,"name": string,"parent_id"?: string | null
                  }
                  Update: {
                    "external_id"?: string | null,"id"?: string,"marketplace_id"?: string | null,"name"?: string,"parent_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_marketplace_id_fkey"
      columns: ["marketplace_id"]
isOneToOne: false
      referencedRelation: "marketplaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"customs_rules": {
                  Row: {
                    "country": string,"duty_rate": number | null,"fetched_at": string,"hs_code": string,"id": string,"notes": string | null,"source_url": string,"status": string,"valid_from": string,"valid_to": string | null,"vat_rate": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "country": string,"duty_rate"?: number | null,"fetched_at": string,"hs_code": string,"id"?: string,"notes"?: string | null,"source_url": string,"status": string,"valid_from": string,"valid_to"?: string | null,"vat_rate"?: number | null
                  }
                  Update: {
                    "country"?: string,"duty_rate"?: number | null,"fetched_at"?: string,"hs_code"?: string,"id"?: string,"notes"?: string | null,"source_url"?: string,"status"?: string,"valid_from"?: string,"valid_to"?: string | null,"vat_rate"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"data_sources": {
                  Row: {
                    "id": string,"last_success_at": string | null,"layer": string,"marketplace_id": string | null,"method": string,"mode": string,"rate_limit_per_day": number | null,"rate_limit_per_minute": number | null,"request_cost": number | null,"request_cost_currency": string | null,"role": string,"status": string,"status_reason": string | null,"success_rate": number | null,"token_expires_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"last_success_at"?: string | null,"layer": string,"marketplace_id"?: string | null,"method": string,"mode"?: string,"rate_limit_per_day"?: number | null,"rate_limit_per_minute"?: number | null,"request_cost"?: number | null,"request_cost_currency"?: string | null,"role": string,"status"?: string,"status_reason"?: string | null,"success_rate"?: number | null,"token_expires_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "id"?: string,"last_success_at"?: string | null,"layer"?: string,"marketplace_id"?: string | null,"method"?: string,"mode"?: string,"rate_limit_per_day"?: number | null,"rate_limit_per_minute"?: number | null,"request_cost"?: number | null,"request_cost_currency"?: string | null,"role"?: string,"status"?: string,"status_reason"?: string | null,"success_rate"?: number | null,"token_expires_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "data_sources_marketplace_id_fkey"
      columns: ["marketplace_id"]
isOneToOne: false
      referencedRelation: "marketplaces"
      referencedColumns: ["id"]
    }
                  ]
                },"demand_history": {
                  Row: {
                    "fetched_at": string,"period_end": string | null,"period_start": string | null,"product_id": string,"raw_response_id": string,"sales_per_month": number,"source_id": string,"synthetic": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "fetched_at": string,"period_end"?: string | null,"period_start"?: string | null,"product_id": string,"raw_response_id": string,"sales_per_month": number,"source_id": string,"synthetic": boolean
                  }
                  Update: {
                    "fetched_at"?: string,"period_end"?: string | null,"period_start"?: string | null,"product_id"?: string,"raw_response_id"?: string,"sales_per_month"?: number,"source_id"?: string,"synthetic"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "demand_history_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "demand_history_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"demand_history_default": {
                  Row: {
                    "fetched_at": string,"period_end": string | null,"period_start": string | null,"product_id": string,"raw_response_id": string,"sales_per_month": number,"source_id": string,"synthetic": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "fetched_at": string,"period_end"?: string | null,"period_start"?: string | null,"product_id": string,"raw_response_id": string,"sales_per_month": number,"source_id": string,"synthetic": boolean
                  }
                  Update: {
                    "fetched_at"?: string,"period_end"?: string | null,"period_start"?: string | null,"product_id"?: string,"raw_response_id"?: string,"sales_per_month"?: number,"source_id"?: string,"synthetic"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"fee_rules": {
                  Row: {
                    "category_id": string | null,"country": string,"currency": string | null,"fee_type": string,"fetched_at": string,"fixed_amount": number | null,"id": string,"marketplace_id": string,"rate": number | null,"source_url": string,"status": string,"valid_from": string,"valid_to": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"country": string,"currency"?: string | null,"fee_type": string,"fetched_at": string,"fixed_amount"?: number | null,"id"?: string,"marketplace_id": string,"rate"?: number | null,"source_url": string,"status": string,"valid_from": string,"valid_to"?: string | null
                  }
                  Update: {
                    "category_id"?: string | null,"country"?: string,"currency"?: string | null,"fee_type"?: string,"fetched_at"?: string,"fixed_amount"?: number | null,"id"?: string,"marketplace_id"?: string,"rate"?: number | null,"source_url"?: string,"status"?: string,"valid_from"?: string,"valid_to"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fee_rules_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fee_rules_marketplace_id_fkey"
      columns: ["marketplace_id"]
isOneToOne: false
      referencedRelation: "marketplaces"
      referencedColumns: ["id"]
    }
                  ]
                },"fx_rates": {
                  Row: {
                    "base_currency": string,"fetched_at": string,"quote_currency": string,"rate": number,"rate_date": string,"source_url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "base_currency": string,"fetched_at": string,"quote_currency": string,"rate": number,"rate_date": string,"source_url": string
                  }
                  Update: {
                    "base_currency"?: string,"fetched_at"?: string,"quote_currency"?: string,"rate"?: number,"rate_date"?: string,"source_url"?: string
                  }
                  Relationships: [
                    
                  ]
                },"invitations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"email": string,"expires_at": string,"id": string,"org_id": string,"role": string,"token_hash": string,"used_at": string | null,"used_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"email": string,"expires_at": string,"id"?: string,"org_id": string,"role": string,"token_hash": string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"email"?: string,"expires_at"?: string,"id"?: string,"org_id"?: string,"role"?: string,"token_hash"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"logistics_rates": {
                  Row: {
                    "amount": number,"country": string,"currency": string,"fetched_at": string,"id": string,"marketplace_id": string,"rate_type": string,"scheme": string,"size_rule": Json | null,"source_url": string,"status": string,"valid_from": string,"valid_to": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"country": string,"currency": string,"fetched_at": string,"id"?: string,"marketplace_id": string,"rate_type": string,"scheme": string,"size_rule"?: Json | null,"source_url": string,"status": string,"valid_from": string,"valid_to"?: string | null
                  }
                  Update: {
                    "amount"?: number,"country"?: string,"currency"?: string,"fetched_at"?: string,"id"?: string,"marketplace_id"?: string,"rate_type"?: string,"scheme"?: string,"size_rule"?: Json | null,"source_url"?: string,"status"?: string,"valid_from"?: string,"valid_to"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "logistics_rates_marketplace_id_fkey"
      columns: ["marketplace_id"]
isOneToOne: false
      referencedRelation: "marketplaces"
      referencedColumns: ["id"]
    }
                  ]
                },"marketplaces": {
                  Row: {
                    "id": string,"name": string,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"name": string,"role": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"role"?: string
                  }
                  Relationships: [
                    
                  ]
                },"matches": {
                  Row: {
                    "confidence": number,"created_at": string,"id": string,"listing_product_id": string,"source_product_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confidence": number,"created_at"?: string,"id"?: string,"listing_product_id": string,"source_product_id": string,"status"?: string
                  }
                  Update: {
                    "confidence"?: number,"created_at"?: string,"id"?: string,"listing_product_id"?: string,"source_product_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "matches_listing_product_id_fkey"
      columns: ["listing_product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_source_product_id_fkey"
      columns: ["source_product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"org_id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"org_id": string,"role": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"org_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"offers": {
                  Row: {
                    "currency": string,"fetched_at": string,"id": string,"method": string,"moq": number | null,"price": number,"product_id": string,"raw_response_id": string,"seller_id": string | null,"source_id": string,"synthetic": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "currency": string,"fetched_at": string,"id"?: string,"method": string,"moq"?: number | null,"price": number,"product_id": string,"raw_response_id": string,"seller_id"?: string | null,"source_id": string,"synthetic": boolean
                  }
                  Update: {
                    "currency"?: string,"fetched_at"?: string,"id"?: string,"method"?: string,"moq"?: number | null,"price"?: number,"product_id"?: string,"raw_response_id"?: string,"seller_id"?: string | null,"source_id"?: string,"synthetic"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "offers_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_raw_response_id_fkey"
      columns: ["raw_response_id"]
isOneToOne: false
      referencedRelation: "raw_responses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"plans": {
                  Row: {
                    "created_at": string,"id": string,"limits": NonNullable<Json>,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"limits"?: NonNullable<Json>,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"limits"?: NonNullable<Json>,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"platform_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"price_history": {
                  Row: {
                    "currency": string,"fetched_at": string,"price": number,"product_id": string,"raw_response_id": string,"source_id": string,"synthetic": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "currency": string,"fetched_at": string,"price": number,"product_id": string,"raw_response_id": string,"source_id": string,"synthetic": boolean
                  }
                  Update: {
                    "currency"?: string,"fetched_at"?: string,"price"?: number,"product_id"?: string,"raw_response_id"?: string,"source_id"?: string,"synthetic"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "price_history_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "price_history_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"price_history_default": {
                  Row: {
                    "currency": string,"fetched_at": string,"price": number,"product_id": string,"raw_response_id": string,"source_id": string,"synthetic": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "currency": string,"fetched_at": string,"price": number,"product_id": string,"raw_response_id": string,"source_id": string,"synthetic": boolean
                  }
                  Update: {
                    "currency"?: string,"fetched_at"?: string,"price"?: number,"product_id"?: string,"raw_response_id"?: string,"source_id"?: string,"synthetic"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"products": {
                  Row: {
                    "category_id": string | null,"dimensions_cm": Json | null,"external_id": string,"first_seen_at": string,"id": string,"kind": string,"source_id": string,"supplier_id": string | null,"synthetic": boolean,"title": string,"url": string | null,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"dimensions_cm"?: Json | null,"external_id": string,"first_seen_at"?: string,"id"?: string,"kind": string,"source_id": string,"supplier_id"?: string | null,"synthetic": boolean,"title": string,"url"?: string | null,"weight_kg"?: number | null
                  }
                  Update: {
                    "category_id"?: string | null,"dimensions_cm"?: Json | null,"external_id"?: string,"first_seen_at"?: string,"id"?: string,"kind"?: string,"source_id"?: string,"supplier_id"?: string | null,"synthetic"?: boolean,"title"?: string,"url"?: string | null,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"raw_responses": {
                  Row: {
                    "adapter_run_id": string | null,"body": NonNullable<Json>,"created_at": string,"fetched_at": string,"id": string,"mode": string,"request": NonNullable<Json>,"source_id": string,"synthetic": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "adapter_run_id"?: string | null,"body": NonNullable<Json>,"created_at"?: string,"fetched_at": string,"id"?: string,"mode": string,"request": NonNullable<Json>,"source_id": string,"synthetic": boolean
                  }
                  Update: {
                    "adapter_run_id"?: string | null,"body"?: NonNullable<Json>,"created_at"?: string,"fetched_at"?: string,"id"?: string,"mode"?: string,"request"?: NonNullable<Json>,"source_id"?: string,"synthetic"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "raw_responses_adapter_run_id_fkey"
      columns: ["adapter_run_id"]
isOneToOne: false
      referencedRelation: "adapter_runs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "raw_responses_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_items": {
                  Row: {
                    "created_at": string,"id": string,"list_id": string,"note": string | null,"org_id": string,"product_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"list_id": string,"note"?: string | null,"org_id": string,"product_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"list_id"?: string,"note"?: string | null,"org_id"?: string,"product_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_items_list_id_org_id_fkey"
      columns: ["list_id","org_id"]
isOneToOne: false
      referencedRelation: "saved_lists"
      referencedColumns: ["id","org_id"]
    },{
      foreignKeyName: "saved_items_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_lists": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"name": string,"org_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"org_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"org_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_lists_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"source_values": {
                  Row: {
                    "entity_id": string,"entity_type": string,"fetched_at": string,"id": string,"method": string,"metric": string,"raw_response_id": string | null,"source_id": string | null,"status": string,"value": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "entity_id": string,"entity_type": string,"fetched_at": string,"id"?: string,"method": string,"metric": string,"raw_response_id"?: string | null,"source_id"?: string | null,"status": string,"value"?: Json | null
                  }
                  Update: {
                    "entity_id"?: string,"entity_type"?: string,"fetched_at"?: string,"id"?: string,"method"?: string,"metric"?: string,"raw_response_id"?: string | null,"source_id"?: string | null,"status"?: string,"value"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "source_values_raw_response_id_fkey"
      columns: ["raw_response_id"]
isOneToOne: false
      referencedRelation: "raw_responses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "source_values_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "created_at": string,"id": string,"org_id": string,"period_end": string | null,"period_start": string | null,"plan_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"org_id": string,"period_end"?: string | null,"period_start"?: string | null,"plan_id": string,"status": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"org_id"?: string,"period_end"?: string | null,"period_start"?: string | null,"plan_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "subscriptions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"suppliers": {
                  Row: {
                    "active_since": string | null,"external_id": string,"id": string,"name": string | null,"rating": number | null,"source_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_since"?: string | null,"external_id": string,"id"?: string,"name"?: string | null,"rating"?: number | null,"source_id": string
                  }
                  Update: {
                    "active_since"?: string | null,"external_id"?: string,"id"?: string,"name"?: string | null,"rating"?: number | null,"source_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "suppliers_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "data_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"tax_profiles": {
                  Row: {
                    "base": string,"country": string,"fetched_at": string,"id": string,"rate": number,"regime": string,"source_url": string,"valid_from": string,"valid_to": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "base": string,"country": string,"fetched_at": string,"id"?: string,"rate": number,"regime": string,"source_url": string,"valid_from": string,"valid_to"?: string | null
                  }
                  Update: {
                    "base"?: string,"country"?: string,"fetched_at"?: string,"id"?: string,"rate"?: number,"regime"?: string,"source_url"?: string,"valid_from"?: string,"valid_to"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"usage_counters": {
                  Row: {
                    "metric": string,"org_id": string,"period_start": string,"used": number
                  }
                  ComputedFields: never
                  Insert: {
                    "metric": string,"org_id": string,"period_start": string,"used"?: number
                  }
                  Update: {
                    "metric"?: string,"org_id"?: string,"period_start"?: string,"used"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "usage_counters_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"user_connections": {
                  Row: {
                    "created_at": string,"expires_at": string | null,"id": string,"marketplace_id": string,"org_id": string,"revoked_at": string | null,"scopes": (string)[],"token_ciphertext": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string | null,"id"?: string,"marketplace_id": string,"org_id": string,"revoked_at"?: string | null,"scopes"?: (string)[],"token_ciphertext": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string | null,"id"?: string,"marketplace_id"?: string,"org_id"?: string,"revoked_at"?: string | null,"scopes"?: (string)[],"token_ciphertext"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_connections_marketplace_id_fkey"
      columns: ["marketplace_id"]
isOneToOne: false
      referencedRelation: "marketplaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_connections_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "consume_invitation":
{ Args: { "p_token": string,"p_user": string }; Returns: string
                           },
"create_invitation":
{ Args: { "p_email": string,"p_org": string,"p_role": string,"p_ttl": string }; Returns: string
                           },
"is_org_member":
{ Args: { "p_org": string }; Returns: boolean
                           },
"is_platform_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"peek_invitation":
{ Args: { "p_token": string }; Returns: {
              "email": string,"org_id": string,"role": string
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
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
            
          }
        }
} as const
