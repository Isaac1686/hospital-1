import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OrderMedications = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        medication_name: '',
        quantity: '',
        unit_price: '',
        supplier: '',
        expected_delivery_date: '',
        notes: ''
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        // Fetch existing orders
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/medication-orders', {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data || []);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Validate form
        if (!formData.medication_name || !formData.quantity || !formData.unit_price) {
            setError('Please fill in all required fields');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/medication-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    quantity: parseInt(formData.quantity),
                    unit_price: parseFloat(formData.unit_price)
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create order');
            }

            const data = await response.json();
            alert('Medication order created successfully!');

            // Reset form and refresh orders list
            setFormData({
                medication_name: '',
                quantity: '',
                unit_price: '',
                supplier: '',
                expected_delivery_date: '',
                notes: ''
            });
            setShowForm(false);
            await fetchOrders();
        } catch (err) {
            console.error('Error creating order:', err);
            setError(err.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        try {
            const response = await fetch(`http://localhost:8000/api/medication-orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({ status: 'cancelled' })
            });

            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }

            alert('Order cancelled successfully');
            await fetchOrders();
        } catch (err) {
            console.error('Error cancelling order:', err);
            alert('Failed to cancel order');
        }
    };

    const getOrderStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate('/pharmacy/dashboard')}
                                className="text-green-600 hover:text-green-700 mr-4"
                            >
                                ← Back
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Order Medications</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            {showForm ? 'Cancel' : '+ New Order'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Form Section */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Create New Medication Order</h2>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Medication Name */}
                                <div>
                                    <label htmlFor="medication_name" className="block text-sm font-medium text-gray-700">
                                        Medication Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="medication_name"
                                        name="medication_name"
                                        value={formData.medication_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., Paracetamol 500mg"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        placeholder="Number of units"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>

                                {/* Unit Price */}
                                <div>
                                    <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
                                        Unit Price (₨) *
                                    </label>
                                    <input
                                        type="number"
                                        id="unit_price"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>

                                {/* Supplier */}
                                <div>
                                    <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                                        Supplier
                                    </label>
                                    <input
                                        type="text"
                                        id="supplier"
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleInputChange}
                                        placeholder="Supplier name"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>

                                {/* Expected Delivery Date */}
                                <div>
                                    <label htmlFor="expected_delivery_date" className="block text-sm font-medium text-gray-700">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        id="expected_delivery_date"
                                        name="expected_delivery_date"
                                        value={formData.expected_delivery_date}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                    Notes
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Additional notes about this order"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Orders List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Recent Medication Orders</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No medication orders found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.medication_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₨ {parseFloat(order.unit_price).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₨ {(order.quantity * parseFloat(order.unit_price)).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                                                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderMedications;
