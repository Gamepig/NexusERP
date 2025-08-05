/**
 * ShipmentTrackingCard.js
 * 
 * Compact shipment tracking card component for use in lists and dashboards
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShipmentTrackingCard = ({ 
    shipment, 
    onTrackingUpdate = null, 
    showDetails = false,
    className = '' 
}) => {
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(showDetails);

    // Fetch tracking information
    const fetchTrackingInfo = async () => {
        if (!shipment?.tracking_number) return;

        setLoading(true);
        try {
            const response = await axios.get(`/api/shipments/track/${shipment.tracking_number}`);
            setTrackingInfo(response.data);
            
            // Notify parent component of tracking update
            if (onTrackingUpdate) {
                onTrackingUpdate(shipment.id, response.data);
            }
        } catch (err) {
            console.error('Error fetching tracking info:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shipment?.tracking_number && !trackingInfo) {
            fetchTrackingInfo();
        }
    }, [shipment?.tracking_number]);

    // Get status display color
    const getStatusColor = (status) => {
        const colors = {
            'picked_up': 'text-blue-600 bg-blue-100 border-blue-200',
            'in_transit': 'text-yellow-600 bg-yellow-100 border-yellow-200',
            'out_for_delivery': 'text-purple-600 bg-purple-100 border-purple-200',
            'delivered': 'text-green-600 bg-green-100 border-green-200',
            'exception': 'text-red-600 bg-red-100 border-red-200',
            'returned': 'text-gray-600 bg-gray-100 border-gray-200',
            'cancelled': 'text-red-600 bg-red-100 border-red-200',
            'unknown': 'text-gray-600 bg-gray-100 border-gray-200'
        };
        return colors[status] || 'text-gray-600 bg-gray-100 border-gray-200';
    };

    // Get status display text
    const getStatusText = (status) => {
        const texts = {
            'picked_up': '已取件',
            'in_transit': '運送中',
            'out_for_delivery': '配送中',
            'delivered': '已送達',
            'exception': '異常',
            'returned': '退回',
            'cancelled': '已取消',
            'unknown': '未知'
        };
        return texts[status] || '未知';
    };

    // Get status icon
    const getStatusIcon = (status) => {
        const icons = {
            'picked_up': '📦',
            'in_transit': '🚛',
            'out_for_delivery': '🚚',
            'delivered': '✅',
            'exception': '⚠️',
            'returned': '↩️',
            'cancelled': '❌',
            'unknown': '❓'
        };
        return icons[status] || '❓';
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!shipment) {
        return null;
    }

    const currentStatus = trackingInfo?.status || shipment?.status || 'unknown';
    const statusText = getStatusText(currentStatus);
    const statusColor = getStatusColor(currentStatus);
    const statusIcon = getStatusIcon(currentStatus);

    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
            {/* Card Header */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <span className="text-xl">{statusIcon}</span>
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                                追蹤號碼: {shipment.tracking_number || '未提供'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                訂單 #{shipment.sales_order_id} • {shipment.carrier || '未知承運商'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
                            {statusText}
                        </span>
                        
                        {trackingInfo && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title={expanded ? '收合詳情' : '展開詳情'}
                            >
                                <svg 
                                    className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">寄送日期:</span>
                        <span className="ml-2 font-medium">
                            {formatDate(shipment.ship_date) || '未設定'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">預計送達:</span>
                        <span className="ml-2 font-medium">
                            {formatDate(trackingInfo?.estimated_delivery || shipment.estimated_delivery) || '未知'}
                        </span>
                    </div>
                </div>

                {/* Loading indicator */}
                {loading && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>更新追蹤資訊...</span>
                    </div>
                )}
            </div>

            {/* Expanded Details */}
            {expanded && trackingInfo && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Delivery Info */}
                    {trackingInfo.actual_delivery && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center space-x-2">
                                <span className="text-green-600">✅</span>
                                <span className="text-sm font-medium text-green-800">
                                    已於 {formatDate(trackingInfo.actual_delivery)} 送達
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Package Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        {trackingInfo.service_type && (
                            <div>
                                <span className="text-gray-500">服務類型:</span>
                                <span className="ml-2">{trackingInfo.service_type}</span>
                            </div>
                        )}
                        {trackingInfo.weight && (
                            <div>
                                <span className="text-gray-500">重量:</span>
                                <span className="ml-2">{trackingInfo.weight} {trackingInfo.weight_unit || 'kg'}</span>
                            </div>
                        )}
                        {trackingInfo.package_count && (
                            <div>
                                <span className="text-gray-500">包裹數量:</span>
                                <span className="ml-2">{trackingInfo.package_count}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-500">最後更新:</span>
                            <span className="ml-2">{formatDate(trackingInfo.last_updated)}</span>
                        </div>
                    </div>

                    {/* Latest Event */}
                    {trackingInfo.tracking_events && trackingInfo.tracking_events.length > 0 && (
                        <div>
                            <h5 className="text-xs font-medium text-gray-700 mb-2">最新動態</h5>
                            <div className="p-3 bg-white border border-gray-200 rounded">
                                {trackingInfo.tracking_events.slice(0, 2).map((event, index) => (
                                    <div key={index} className={`${index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-gray-900">{event.description}</p>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {formatDate(event.timestamp)}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <p className="text-xs text-gray-600 mt-1">📍 {event.location}</p>
                                        )}
                                    </div>
                                ))}
                                
                                {trackingInfo.tracking_events.length > 2 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        還有 {trackingInfo.tracking_events.length - 2} 個追蹤記錄...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Refresh Button */}
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={fetchTrackingInfo}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '更新中...' : '重新整理'}
                        </button>
                    </div>
                </div>
            )}

            {/* No tracking number */}
            {!shipment.tracking_number && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 text-center">尚未提供追蹤號碼</p>
                </div>
            )}
        </div>
    );
};

export default ShipmentTrackingCard;