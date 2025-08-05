/**
 * ShipmentTracking.js
 * 
 * React component for displaying shipment tracking information
 * Integrates with backend logistics API to show real-time tracking status
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShipmentTracking = ({ trackingNumber, salesOrderId, className = '' }) => {
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(null);

    // Fetch tracking information
    const fetchTrackingInfo = async () => {
        if (!trackingNumber) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/shipments/track/${trackingNumber}`);
            setTrackingInfo(response.data);
        } catch (err) {
            console.error('Error fetching tracking info:', err);
            setError(err.response?.data?.message || '無法獲取追蹤資訊');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh tracking info every 30 seconds for active shipments
    useEffect(() => {
        if (trackingNumber && trackingInfo && isActiveStatus(trackingInfo.status)) {
            const interval = setInterval(fetchTrackingInfo, 30000);
            setRefreshInterval(interval);
            return () => clearInterval(interval);
        }
    }, [trackingNumber, trackingInfo]);

    // Initial fetch
    useEffect(() => {
        fetchTrackingInfo();
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [trackingNumber]);

    // Check if status requires active tracking
    const isActiveStatus = (status) => {
        return ['picked_up', 'in_transit', 'out_for_delivery'].includes(status);
    };

    // Get status display color
    const getStatusColor = (status) => {
        const colors = {
            'picked_up': 'text-blue-600 bg-blue-100',
            'in_transit': 'text-yellow-600 bg-yellow-100',
            'out_for_delivery': 'text-purple-600 bg-purple-100',
            'delivered': 'text-green-600 bg-green-100',
            'exception': 'text-red-600 bg-red-100',
            'returned': 'text-gray-600 bg-gray-100',
            'cancelled': 'text-red-600 bg-red-100',
            'unknown': 'text-gray-600 bg-gray-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
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
            'unknown': '未知狀態'
        };
        return texts[status] || '未知狀態';
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!trackingNumber) {
        return (
            <div className={`p-4 border border-gray-300 rounded-lg ${className}`}>
                <p className="text-gray-500">尚未提供追蹤號碼</p>
            </div>
        );
    }

    if (loading && !trackingInfo) {
        return (
            <div className={`p-4 border border-gray-300 rounded-lg ${className}`}>
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">載入追蹤資訊...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-4 border border-red-300 rounded-lg bg-red-50 ${className}`}>
                <div className="flex items-center justify-between">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={fetchTrackingInfo}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        重試
                    </button>
                </div>
            </div>
        );
    }

    if (!trackingInfo) {
        return (
            <div className={`p-4 border border-gray-300 rounded-lg ${className}`}>
                <p className="text-gray-500">無法載入追蹤資訊</p>
            </div>
        );
    }

    return (
        <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">物流追蹤</h3>
                        <p className="text-sm text-gray-600">追蹤號碼: {trackingNumber}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingInfo.status)}`}>
                            {getStatusText(trackingInfo.status)}
                        </span>
                        <button 
                            onClick={fetchTrackingInfo}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                            {loading ? '更新中...' : '更新'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracking Summary */}
            <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-600">承運商</p>
                        <p className="font-medium">{trackingInfo.carrier}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">服務類型</p>
                        <p className="font-medium">{trackingInfo.service_type || '標準配送'}</p>
                    </div>
                    {trackingInfo.estimated_delivery && (
                        <div>
                            <p className="text-sm text-gray-600">預計送達</p>
                            <p className="font-medium">{formatDate(trackingInfo.estimated_delivery)}</p>
                        </div>
                    )}
                    {trackingInfo.actual_delivery && (
                        <div>
                            <p className="text-sm text-gray-600">實際送達</p>
                            <p className="font-medium text-green-600">{formatDate(trackingInfo.actual_delivery)}</p>
                        </div>
                    )}
                    {trackingInfo.weight && (
                        <div>
                            <p className="text-sm text-gray-600">重量</p>
                            <p className="font-medium">{trackingInfo.weight} {trackingInfo.weight_unit || 'kg'}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-gray-600">最後更新</p>
                        <p className="font-medium">{formatDate(trackingInfo.last_updated)}</p>
                    </div>
                </div>

                {/* Address Information */}
                {(trackingInfo.origin_address || trackingInfo.destination_address) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        {trackingInfo.origin_address && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">寄件地址</h4>
                                <p className="text-sm text-gray-600">
                                    {trackingInfo.origin_address.name && (
                                        <>{trackingInfo.origin_address.name}<br/></>
                                    )}
                                    {trackingInfo.origin_address.address_line}<br/>
                                    {trackingInfo.origin_address.city}, {trackingInfo.origin_address.state} {trackingInfo.origin_address.postal_code}<br/>
                                    {trackingInfo.origin_address.country}
                                </p>
                            </div>
                        )}
                        {trackingInfo.destination_address && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">收件地址</h4>
                                <p className="text-sm text-gray-600">
                                    {trackingInfo.destination_address.name && (
                                        <>{trackingInfo.destination_address.name}<br/></>
                                    )}
                                    {trackingInfo.destination_address.address_line}<br/>
                                    {trackingInfo.destination_address.city}, {trackingInfo.destination_address.state} {trackingInfo.destination_address.postal_code}<br/>
                                    {trackingInfo.destination_address.country}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tracking Events Timeline */}
                {trackingInfo.tracking_events && trackingInfo.tracking_events.length > 0 && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">追蹤記錄</h4>
                        <div className="space-y-4">
                            {trackingInfo.tracking_events.map((event, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    {/* Timeline dot */}
                                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                                        index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}></div>
                                    
                                    {/* Event content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">
                                                {event.description}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(event.timestamp)}
                                            </p>
                                        </div>
                                        {event.location && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                📍 {event.location}
                                            </p>
                                        )}
                                        {event.signed_by && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                簽收人: {event.signed_by}
                                            </p>
                                        )}
                                        {event.event_code && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                事件代碼: {event.event_code}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No tracking events message */}
                {(!trackingInfo.tracking_events || trackingInfo.tracking_events.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                        <p>暫無追蹤記錄</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShipmentTracking;