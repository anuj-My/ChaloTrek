export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      batch_alert_emails: {
        Row: {
          alert_id: string
          batch_id: string
          sent_at: string
        }
        Insert: {
          alert_id: string
          batch_id: string
          sent_at?: string
        }
        Update: {
          alert_id?: string
          batch_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_alert_emails_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "batch_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_alert_emails_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_alerts: {
        Row: {
          created_at: string
          destination_id: string | null
          email: string
          id: string
          trek_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_id?: string | null
          email: string
          id?: string
          trek_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          destination_id?: string | null
          email?: string
          id?: string
          trek_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_alerts_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_alerts_trek_id_fkey"
            columns: ["trek_id"]
            isOneToOne: false
            referencedRelation: "treks"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_group_links: {
        Row: {
          batch_id: string
          created_at: string
          updated_at: string
          url: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          updated_at?: string
          url: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_group_links_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: true
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          created_at: string
          deposit_paise: number | null
          end_date: string
          id: string
          price_paise: number
          start_date: string
          status: Database["public"]["Enums"]["batch_status"]
          total_seats: number
          trek_id: string
          updated_at: string
          seats_left: number | null
        }
        Insert: {
          created_at?: string
          deposit_paise?: number | null
          end_date: string
          id?: string
          price_paise: number
          start_date: string
          status?: Database["public"]["Enums"]["batch_status"]
          total_seats: number
          trek_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_paise?: number | null
          end_date?: string
          id?: string
          price_paise?: number
          start_date?: string
          status?: Database["public"]["Enums"]["batch_status"]
          total_seats?: number
          trek_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_trek_id_fkey"
            columns: ["trek_id"]
            isOneToOne: false
            referencedRelation: "treks"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_emails: {
        Row: {
          booking_id: string
          kind: Database["public"]["Enums"]["booking_email_kind"]
          sent_at: string
        }
        Insert: {
          booking_id: string
          kind: Database["public"]["Enums"]["booking_email_kind"]
          sent_at?: string
        }
        Update: {
          booking_id?: string
          kind?: Database["public"]["Enums"]["booking_email_kind"]
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_emails_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          batch_id: string
          booking_number: number
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["booking_canceller"] | null
          contact_email: string
          contact_phone: string
          coupon_id: string | null
          created_at: string
          discount_paise: number
          hold_expires_at: string | null
          id: string
          num_people: number
          paid_offline: boolean
          paid_paise: number
          source: Database["public"]["Enums"]["booking_source"]
          source_tag: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id: string
          booking_number?: never
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["booking_canceller"] | null
          contact_email: string
          contact_phone: string
          coupon_id?: string | null
          created_at?: string
          discount_paise?: number
          hold_expires_at?: string | null
          id?: string
          num_people: number
          paid_offline?: boolean
          paid_paise?: number
          source?: Database["public"]["Enums"]["booking_source"]
          source_tag?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          booking_number?: never
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["booking_canceller"] | null
          contact_email?: string
          contact_phone?: string
          coupon_id?: string | null
          created_at?: string
          discount_paise?: number
          hold_expires_at?: string | null
          id?: string
          num_people?: number
          paid_offline?: boolean
          paid_paise?: number
          source?: Database["public"]["Enums"]["booking_source"]
          source_tag?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          description: string
          id: number
          name: string
          rules: Json
        }
        Insert: {
          description: string
          id: number
          name: string
          rules: Json
        }
        Update: {
          description?: string
          id?: number
          name?: string
          rules?: Json
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          amount_off_paise: number | null
          code: string
          created_at: string
          id: string
          max_uses: number | null
          organizer_id: string
          percent_off: number | null
          trek_id: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          amount_off_paise?: number | null
          code: string
          created_at?: string
          id?: string
          max_uses?: number | null
          organizer_id: string
          percent_off?: number | null
          trek_id?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          amount_off_paise?: number | null
          code?: string
          created_at?: string
          id?: string
          max_uses?: number | null
          organizer_id?: string
          percent_off?: number | null
          trek_id?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_trek_id_fkey"
            columns: ["trek_id"]
            isOneToOne: false
            referencedRelation: "treks"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          created_at: string
          id: string
          name: string
          region: string
          slug: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region: string
          slug: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region?: string
          slug?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organizer_kyc: {
        Row: {
          created_at: string
          gstin: string | null
          legal_name: string | null
          organizer_id: string
          pan: string | null
          razorpay_account_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          submitted_at: string | null
          tourism_reg_no: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gstin?: string | null
          legal_name?: string | null
          organizer_id: string
          pan?: string | null
          razorpay_account_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          tourism_reg_no?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gstin?: string | null
          legal_name?: string | null
          organizer_id?: string
          pan?: string | null
          razorpay_account_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          tourism_reg_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_kyc_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          instagram_handle: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          logo_url: string | null
          name: string
          owner_user_id: string
          phone: string | null
          slug: string
          updated_at: string
          upi_id: string | null
          verified_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram_handle?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          logo_url?: string | null
          name: string
          owner_user_id: string
          phone?: string | null
          slug: string
          updated_at?: string
          upi_id?: string | null
          verified_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram_handle?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string
          upi_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          age: number | null
          booking_id: string
          created_at: string
          details_token: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          id_proof_path: string | null
          medical_notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          booking_id: string
          created_at?: string
          details_token?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          id_proof_path?: string | null
          medical_notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          booking_id?: string
          created_at?: string
          details_token?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          id_proof_path?: string | null
          medical_notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount_paise: number
          booking_id: string
          created_at: string
          id: string
          reject_reason: string | null
          reviewed_at: string | null
          screenshot_path: string | null
          status: Database["public"]["Enums"]["payment_proof_status"]
          utr: string
        }
        Insert: {
          amount_paise: number
          booking_id: string
          created_at?: string
          id?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["payment_proof_status"]
          utr: string
        }
        Update: {
          amount_paise?: number
          booking_id?: string
          created_at?: string
          id?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["payment_proof_status"]
          utr?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          booking_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          platform_fee_paise: number
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_paise: number
          booking_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          platform_fee_paise?: number
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          booking_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          platform_fee_paise?: number
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          payment_id: string
          razorpay_refund_id: string | null
          reason: string
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          id?: string
          payment_id: string
          razorpay_refund_id?: string | null
          reason: string
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          payment_id?: string
          razorpay_refund_id?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          body: string | null
          booking_id: string
          created_at: string
          hidden: boolean
          id: string
          organizer_id: string
          rating: number
          trek_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          body?: string | null
          booking_id: string
          created_at?: string
          hidden?: boolean
          id?: string
          organizer_id: string
          rating: number
          trek_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string | null
          booking_id?: string
          created_at?: string
          hidden?: boolean
          id?: string
          organizer_id?: string
          rating?: number
          trek_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trek_id_fkey"
            columns: ["trek_id"]
            isOneToOne: false
            referencedRelation: "treks"
            referencedColumns: ["id"]
          },
        ]
      }
      trek_views: {
        Row: {
          day: string
          source_tag: string
          trek_id: string
          views: number
        }
        Insert: {
          day: string
          source_tag?: string
          trek_id: string
          views?: number
        }
        Update: {
          day?: string
          source_tag?: string
          trek_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "trek_views_trek_id_fkey"
            columns: ["trek_id"]
            isOneToOne: false
            referencedRelation: "treks"
            referencedColumns: ["id"]
          },
        ]
      }
      treks: {
        Row: {
          cancellation_policy_id: number
          created_at: string
          destination_id: string | null
          difficulty: Database["public"]["Enums"]["trek_difficulty"]
          duration_days: number
          exclusions: string[]
          id: string
          inclusions: string[]
          itinerary: Json
          max_altitude_m: number | null
          name: string
          organizer_id: string
          photos: string[]
          region: string
          slug: string
          status: Database["public"]["Enums"]["trek_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          cancellation_policy_id: number
          created_at?: string
          destination_id?: string | null
          difficulty: Database["public"]["Enums"]["trek_difficulty"]
          duration_days: number
          exclusions?: string[]
          id?: string
          inclusions?: string[]
          itinerary?: Json
          max_altitude_m?: number | null
          name: string
          organizer_id: string
          photos?: string[]
          region: string
          slug: string
          status?: Database["public"]["Enums"]["trek_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_policy_id?: number
          created_at?: string
          destination_id?: string | null
          difficulty?: Database["public"]["Enums"]["trek_difficulty"]
          duration_days?: number
          exclusions?: string[]
          id?: string
          inclusions?: string[]
          itinerary?: Json
          max_altitude_m?: number | null
          name?: string
          organizer_id?: string
          photos?: string[]
          region?: string
          slug?: string
          status?: Database["public"]["Enums"]["trek_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treks_cancellation_policy_id_fkey"
            columns: ["cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treks_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treks_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          batch_id: string
          created_at: string
          email: string
          id: string
          notified_at: string | null
          num_people: number
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          num_people: number
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          num_people?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_batch: {
        Args: {
          p_batch_id: string
          p_contact_email: string
          p_contact_phone: string
          p_coupon_code?: string
          p_participants: Json
          p_source?: Database["public"]["Enums"]["booking_source"]
          p_source_tag?: string
        }
        Returns: {
          batch_id: string
          booking_number: number
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["booking_canceller"] | null
          contact_email: string
          contact_phone: string
          coupon_id: string | null
          created_at: string
          discount_paise: number
          hold_expires_at: string | null
          id: string
          num_people: number
          paid_offline: boolean
          paid_paise: number
          source: Database["public"]["Enums"]["booking_source"]
          source_tag: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          batch_id: string
          booking_number: number
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["booking_canceller"] | null
          contact_email: string
          contact_phone: string
          coupon_id: string | null
          created_at: string
          discount_paise: number
          hold_expires_at: string | null
          id: string
          num_people: number
          paid_offline: boolean
          paid_paise: number
          source: Database["public"]["Enums"]["booking_source"]
          source_tag: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_coupon: {
        Args: { p_batch_id: string; p_code: string }
        Returns: {
          amount_off_paise: number
          code: string
          percent_off: number
        }[]
      }
      coupon_discount: {
        Args: {
          c: Database["public"]["Tables"]["coupons"]["Row"]
          p_num_people: number
          p_price_paise: number
        }
        Returns: number
      }
      coupon_uses: { Args: { c_id: string }; Returns: number }
      find_coupon: {
        Args: { p_batch_id: string; p_code: string }
        Returns: {
          active: boolean
          amount_off_paise: number | null
          code: string
          created_at: string
          id: string
          max_uses: number | null
          organizer_id: string
          percent_off: number | null
          trek_id: string | null
          updated_at: string
          valid_until: string | null
        }
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_participant_by_token: {
        Args: { p_token: string }
        Returns: {
          age: number
          booking_number: number
          can_edit: boolean
          emergency_contact_name: string
          emergency_contact_phone: string
          end_date: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          medical_notes: string
          organizer_name: string
          phone: string
          start_date: string
          trek_name: string
        }[]
      }
      has_confirmed_booking: { Args: { b_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_app_user: { Args: never; Returns: boolean }
      organizes_booking: { Args: { bk_id: string }; Returns: boolean }
      owns_batch: { Args: { b_id: string }; Returns: boolean }
      owns_booking: { Args: { bk_id: string }; Returns: boolean }
      owns_organizer: { Args: { org_id: string }; Returns: boolean }
      owns_trek: { Args: { t_id: string }; Returns: boolean }
      owns_trek_photo_path: { Args: { path: string }; Returns: boolean }
      participant_details_open: {
        Args: { p: Database["public"]["Tables"]["participants"]["Row"] }
        Returns: boolean
      }
      payment_proof_booking: { Args: { path: string }; Returns: string }
      record_offline_payment: {
        Args: { p_booking_id: string; p_paid_paise: number }
        Returns: {
          batch_id: string
          booking_number: number
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["booking_canceller"] | null
          contact_email: string
          contact_phone: string
          coupon_id: string | null
          created_at: string
          discount_paise: number
          hold_expires_at: string | null
          id: string
          num_people: number
          paid_offline: boolean
          paid_paise: number
          source: Database["public"]["Enums"]["booking_source"]
          source_tag: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_trek_view: {
        Args: { p_source_tag?: string; p_trek_id: string }
        Returns: undefined
      }
      review_payment_proof: {
        Args: { p_accept: boolean; p_proof_id: string; p_reason?: string }
        Returns: {
          amount_paise: number
          booking_id: string
          created_at: string
          id: string
          reject_reason: string | null
          reviewed_at: string | null
          screenshot_path: string | null
          status: Database["public"]["Enums"]["payment_proof_status"]
          utr: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_proofs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_participant_details: {
        Args: {
          p_age: number
          p_emergency_contact_name: string
          p_emergency_contact_phone: string
          p_gender: Database["public"]["Enums"]["gender"]
          p_medical_notes: string
          p_phone: string
          p_token: string
        }
        Returns: undefined
      }
      seats_left: {
        Args: { "": Database["public"]["Tables"]["batches"]["Row"] }
        Returns: {
          error: true
        } & "the function public.seats_left with parameter or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache"
      }
      seats_taken: { Args: { b_id: string }; Returns: number }
      submit_payment_proof: {
        Args: {
          p_amount_paise: number
          p_booking_id: string
          p_screenshot_path?: string
          p_utr: string
        }
        Returns: {
          amount_paise: number
          booking_id: string
          created_at: string
          id: string
          reject_reason: string | null
          reviewed_at: string | null
          screenshot_path: string | null
          status: Database["public"]["Enums"]["payment_proof_status"]
          utr: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_proofs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_review: {
        Args: {
          p_author_name: string
          p_body: string
          p_booking_id: string
          p_rating: number
        }
        Returns: {
          author_name: string
          body: string | null
          booking_id: string
          created_at: string
          hidden: boolean
          id: string
          organizer_id: string
          rating: number
          trek_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      trek_is_public: { Args: { t_id: string }; Returns: boolean }
    }
    Enums: {
      batch_status: "open" | "closed" | "cancelled"
      booking_canceller: "organizer" | "trekker"
      booking_email_kind:
        | "balance_reminder"
        | "trek_reminder"
        | "review_request"
      booking_source: "organizer_link" | "marketplace"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "expired"
        | "refunded"
      gender: "male" | "female" | "other"
      kyc_status: "pending" | "approved" | "rejected"
      payment_kind: "full" | "deposit" | "balance"
      payment_proof_status: "submitted" | "accepted" | "rejected"
      payment_status: "created" | "paid" | "failed" | "refunded"
      refund_status: "requested" | "processed" | "failed"
      trek_difficulty: "easy" | "moderate" | "difficult" | "challenging"
      trek_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      batch_status: ["open", "closed", "cancelled"],
      booking_canceller: ["organizer", "trekker"],
      booking_email_kind: [
        "balance_reminder",
        "trek_reminder",
        "review_request",
      ],
      booking_source: ["organizer_link", "marketplace"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "expired",
        "refunded",
      ],
      gender: ["male", "female", "other"],
      kyc_status: ["pending", "approved", "rejected"],
      payment_kind: ["full", "deposit", "balance"],
      payment_proof_status: ["submitted", "accepted", "rejected"],
      payment_status: ["created", "paid", "failed", "refunded"],
      refund_status: ["requested", "processed", "failed"],
      trek_difficulty: ["easy", "moderate", "difficult", "challenging"],
      trek_status: ["draft", "published", "archived"],
    },
  },
} as const
