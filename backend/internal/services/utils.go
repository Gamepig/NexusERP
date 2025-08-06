package services

import (
	"database/sql"
	"time"
)

// Helper functions for nullable types

func nullStringToPointer(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

func nullInt64ToPointer(ni sql.NullInt64) *int64 {
	if !ni.Valid {
		return nil
	}
	return &ni.Int64
}

func nullFloat64ToPointer(nf sql.NullFloat64) *float64 {
	if !nf.Valid {
		return nil
	}
	return &nf.Float64
}

func nullTimeToPointer(nt sql.NullTime) *time.Time {
	if !nt.Valid {
		return nil
	}
	return &nt.Time
}

func nullStringFromString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

// Helper function for handling nullable int64 to *int conversion (used in inventory)
func nullInt64ToIntPointer(ni sql.NullInt64) *int {
	if !ni.Valid {
		return nil
	}
	val := int(ni.Int64)
	return &val
}