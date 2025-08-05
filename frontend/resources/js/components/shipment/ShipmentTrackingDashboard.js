/**
 * ShipmentTrackingDashboard.js
 * 
 * Dashboard component for managing and tracking multiple shipments
 * Provides batch tracking functionality and overview statistics
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ShipmentTrackingCard from './ShipmentTrackingCard';

const ShipmentTrackingDashboard = ({ 
    salesOrderId = null, 
    customerId = null,
    className = '' 
}) => {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        carrier: 'all',
        dateRange: '30' // days
    });
    const [stats, setStats] = useState({
        total: 0,
        delivered: 0,
        inTransit: 0,
        exceptions: 0
    });

    // Fetch shipments based on filters
    const fetchShipments = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            
            if (salesOrderId) params.append('sales_order_id', salesOrderId);
            if (customerId) params.append('customer_id', customerId);
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.carrier !== 'all') params.append('carrier', filters.carrier);
            if (filters.dateRange !== 'all') {
                const date = new Date();
                date.setDate(date.getDate() - parseInt(filters.dateRange));
                params.append('date_from', date.toISOString().split('T')[0]);
            }

            const response = await axios.get(`/api/shipments?${params.toString()}`);
            setShipments(response.data.shipments || []);
            
            // Calculate stats
            const newStats = response.data.shipments.reduce((acc, shipment) => {
                acc.total++;
                switch (shipment.status) {
                    case 'delivered':
                        acc.delivered++;
                        break;
                    case 'in_transit':
                    case 'picked_up':
                    case 'out_for_delivery':
                        acc.inTransit++;
                        break;
                    case 'exception':
                    case 'returned':
                        acc.exceptions++;
                        break;
                }
                return acc;
            }, { total: 0, delivered: 0, inTransit: 0, exceptions: 0 });
            
            setStats(newStats);
        } catch (err) {
            console.error('Error fetching shipments:', err);
            setError(err.response?.data?.message || '無法載入貨件資料');
        } finally {
            setLoading(false);
        }
    };

    // Batch update tracking for all active shipments
    const batchUpdateTracking = async () => {
        const activeShipments = shipments.filter(s => 
            s.tracking_number && ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)
        );

        if (activeShipments.length === 0) {
            alert('沒有需要更新的活躍貨件');
            return;
        }

        setLoading(true);
        try {
            const trackingNumbers = activeShipments.map(s => s.tracking_number);
            const response = await axios.post('/api/shipments/track/batch', {
                tracking_numbers: trackingNumbers
            });

            // Update shipments with new tracking info
            const updatedShipments = shipments.map(shipment => {
                const trackingInfo = response.data[shipment.tracking_number];
                if (trackingInfo) {
                    return {
                        ...shipment,
                        status: trackingInfo.status,
                        status_description: trackingInfo.status_description,
                        estimated_delivery: trackingInfo.estimated_delivery,
                        actual_delivery: trackingInfo.actual_delivery,
                        last_tracked: new Date().toISOString()
                    };
                }
                return shipment;
            });

            setShipments(updatedShipments);
            alert(`成功更新 ${Object.keys(response.data).length} 個貨件的追蹤資訊`);
        } catch (err) {
            console.error('Error batch updating tracking:', err);
            alert('批量更新失敗: ' + (err.response?.data?.message || '未知錯誤'));
        } finally {
            setLoading(false);
        }
    };

    // Handle individual tracking update
    const handleTrackingUpdate = (shipmentId, trackingInfo) => {
        setShipments(prevShipments => 
            prevShipments.map(shipment => 
                shipment.id === shipmentId 
                    ? {
                        ...shipment,
                        status: trackingInfo.status,
                        status_description: trackingInfo.status_description,
                        estimated_delivery: trackingInfo.estimated_delivery,
                        actual_delivery: trackingInfo.actual_delivery,
                        last_tracked: new Date().toISOString()
                    }
                    : shipment
            )
        );
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Initial data fetch
    useEffect(() => {
        fetchShipments();
    }, [salesOrderId, customerId, filters]);

    // Get unique carriers for filter
    const getUniqueCarriers = () => {
        const carriers = [...new Set(shipments.map(s => s.carrier).filter(Boolean))];
        return carriers;
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">物流追蹤管理</h2>
                    <p className="text-sm text-gray-600">
                        {salesOrderId && `訂單 #${salesOrderId} 的貨件`}
                        {customerId && `客戶 ID ${customerId} 的貨件`}
                        {!salesOrderId && !customerId && '所有貨件'}
                    </p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button
                        onClick={batchUpdateTracking}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        {loading ? '更新中...' : '批量更新追蹤'}
                    </button>
                    <button
                        onClick={fetchShipments}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
                    >
                        重新整理
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">📦</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">總計貨件</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">✅</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">已送達</p>
                            <p className="text-2xl font-semibold text-green-600">{stats.delivered}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">🚛</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">運送中</p>
                            <p className="text-2xl font-semibold text-blue-600">{stats.inTransit}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">異常</p>
                            <p className="text-2xl font-semibold text-red-600">{stats.exceptions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="all">全部狀態</option>
                            <option value="picked_up">已取件</option>
                            <option value="in_transit">運送中</option>
                            <option value="out_for_delivery">配送中</option>
                            <option value="delivered">已送達</option>
                            <option value="exception">異常</option>
                            <option value="returned">退回</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">承運商</label>
                        <select
                            value={filters.carrier}
                            onChange={(e) => handleFilterChange('carrier', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="all">全部承運商</option>
                            {getUniqueCarriers().map(carrier => (
                                <option key={carrier} value={carrier}>{carrier}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">時間範圍</label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="7">近 7 天</option>
                            <option value="30">近 30 天</option>
                            <option value="90">近 90 天</option>
                            <option value="all">全部時間</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="text-red-600 mr-2">❌</span>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && !shipments.length && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">載入貨件資料...</span>
                </div>
            )}

            {/* Shipments List */}
            {!loading && shipments.length === 0 && (
                <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">📦</span>
                    <p className="text-gray-500">沒有找到符合條件的貨件</p>
                </div>
            )}

            {shipments.length > 0 && (
                <div className="space-y-4">
                    {shipments.map(shipment => (
                        <ShipmentTrackingCard
                            key={shipment.id}
                            shipment={shipment}
                            onTrackingUpdate={handleTrackingUpdate}
                            showDetails={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShipmentTrackingDashboard;