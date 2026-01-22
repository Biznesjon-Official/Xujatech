import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Plus,
  DollarSign,
  Trash2,
  User,
  Phone,
  X,
  TrendingUp,
  History,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Building,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';

interface Customer {
  _id: string;
  fullName: string;
  phone?: string;
  currentDebt: number;
  debtLimit?: number;
  debtDueDate?: string;
  createdAt: string;
  addedBy?: string;
  lastDebtDate?: string;
  debtLogId?: string; // Kassir rejimida qarz log ID
}

interface MyDebtPayment {
  _id: string;
  amount: number;
  paidAt: string;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
  type?: 'full' | 'partial';
}

interface MyDebt {
  _id: string;
  creditorName: string;
  creditorPhone?: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  type: 'supplier' | 'person' | 'other';
  payments?: MyDebtPayment[];
  status?: 'active' | 'paid';
}

interface DebtStats {
  pending: number;
  todayDue: number;
  paid: number;
  overdue: number;
  total: number;
}

const Debts: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'overdue' | 'today'>('all');
  const [stats, setStats] = useState<DebtStats>({ pending: 0, todayDue: 0, paid: 0, overdue: 0, total: 0 });

  const [myDebts, setMyDebts] = useState<MyDebt[]>([]);
  const [myDebtsLoading, setMyDebtsLoading] = useState(false);
  const [myDebtsStats, setMyDebtsStats] = useState<DebtStats>({ pending: 0, todayDue: 0, paid: 0, overdue: 0, total: 0 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddMyDebtModal, setShowAddMyDebtModal] = useState(false);
  const [showPayMyDebtModal, setShowPayMyDebtModal] = useState(false);
  const [showPartialPayModal, setShowPartialPayModal] = useState(false);
  const [showMyDebtDetailModal, setShowMyDebtDetailModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedMyDebt, setSelectedMyDebt] = useState<MyDebt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payReceivedBy, setPayReceivedBy] = useState('');
  const [partialPayForm, setPartialPayForm] = useState({
    amount: '',
    recipientName: '',
    recipientPhone: '',
    notes: ''
  });
  const [debtHistory, setDebtHistory] = useState<any[]>([]);
  const [form, setForm] = useState({
    customerId: '',
    amountUsd: '',
    amountUzs: '',
    dueDate: '',
    notes: '',
    initialPaymentUsd: '',
    initialPaymentUzs: ''
  });
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ fullName: '', phone: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  // Kafil (Guarantor) form
  const [guarantorForm, setGuarantorForm] = useState({ fullName: '', phone: '', address: '' });
  const [showGuarantorSection, setShowGuarantorSection] = useState(false);
  // Bo'lib to'lash (Installment) form
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [installmentDates, setInstallmentDates] = useState<string[]>([]);
  const [myDebtForm, setMyDebtForm] = useState({
    creditorName: '',
    creditorPhone: '',
    amountUsd: '',
    amountUzs: '',
    dueDate: '',
    notes: '',
    type: 'supplier' as 'supplier' | 'person' | 'other',
    initialPaymentUsd: '',
    initialPaymentUzs: '',
  });

  // Currency exchange rate
  const [usdRate, setUsdRate] = useState(12500);
  const [rateLoading, setRateLoading] = useState(false);

  // CBU API'dan valyuta kursini olish
  const fetchExchangeRate = async () => {
    setRateLoading(true);
    try {
      const response = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
      const data = await response.json();
      const usdCurrency = data.find((item: any) => item.Ccy === 'USD');
      if (usdCurrency) {
        const rate = parseFloat(usdCurrency.Rate);
        setUsdRate(Math.round(rate));
      }
    } catch (error) {
      console.error('Valyuta kursini olishda xatolik:', error);
    } finally {
      setRateLoading(false);
    }
  };

  // USD o'zgarganda UZS ni hisoblash
  const handleAmountUsdChange = (value: string, formType: 'receivable' | 'payable') => {
    const usdValue = parseFloat(value) || 0;
    if (formType === 'receivable') {
      setForm({ ...form, amountUsd: value, amountUzs: usdValue ? Math.round(usdValue * usdRate).toString() : '' });
    } else {
      setMyDebtForm({ ...myDebtForm, amountUsd: value, amountUzs: usdValue ? Math.round(usdValue * usdRate).toString() : '' });
    }
  };

  // UZS o'zgarganda USD ni hisoblash
  const handleAmountUzsChange = (value: string, formType: 'receivable' | 'payable') => {
    const uzsValue = parseFloat(value) || 0;
    if (formType === 'receivable') {
      setForm({ ...form, amountUzs: value, amountUsd: uzsValue ? (uzsValue / usdRate).toFixed(2) : '' });
    } else {
      setMyDebtForm({ ...myDebtForm, amountUzs: value, amountUsd: uzsValue ? (uzsValue / usdRate).toFixed(2) : '' });
    }
  };

  // Boshlang'ich to'lov USD o'zgarganda UZS ni hisoblash
  const handleInitialPaymentUsdChange = (value: string) => {
    const usdValue = parseFloat(value) || 0;
    setForm({
      ...form,
      initialPaymentUsd: value,
      initialPaymentUzs: usdValue ? Math.round(usdValue * usdRate).toString() : ''
    });
  };

  // Boshlang'ich to'lov UZS o'zgarganda USD ni hisoblash
  const handleInitialPaymentUzsChange = (value: string) => {
    const uzsValue = parseFloat(value) || 0;
    setForm({
      ...form,
      initialPaymentUzs: value,
      initialPaymentUsd: uzsValue ? (uzsValue / usdRate).toFixed(2) : ''
    });
  };

  // Boshlang'ich to'lov USD o'zgarganda UZS ni hisoblash (Men qarzdorman uchun)
  const handleMyDebtInitialPaymentUsdChange = (value: string) => {
    const usdValue = parseFloat(value) || 0;
    setMyDebtForm({
      ...myDebtForm,
      initialPaymentUsd: value,
      initialPaymentUzs: usdValue ? Math.round(usdValue * usdRate).toString() : ''
    });
  };

  // Boshlang'ich to'lov UZS o'zgarganda USD ni hisoblash (Men qarzdorman uchun)
  const handleMyDebtInitialPaymentUzsChange = (value: string) => {
    const uzsValue = parseFloat(value) || 0;
    setMyDebtForm({
      ...myDebtForm,
      initialPaymentUzs: value,
      initialPaymentUsd: uzsValue ? (uzsValue / usdRate).toFixed(2) : ''
    });
  };

  // Oddiy sana komponenti - kun/oy/yil
  const SimpleDateInput = ({ 
    value, 
    onChange, 
    className = "" 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    className?: string; 
  }) => {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Value o'zgarganda ichki qiymatlarni yangilash
    useEffect(() => {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setDay(date.getDate().toString());
          setMonth((date.getMonth() + 1).toString());
          setYear(date.getFullYear().toString());
        }
      }
    }, [value]);

    // Sana yaratish
    const updateDate = () => {
      if (day && month && year) {
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
          const date = new Date(yearNum, monthNum - 1, dayNum);
          onChange(date.toISOString().split('T')[0]);
        }
      }
    };

    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="flex-1">
          <input
            type="text"
            value={day}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                setDay(val);
              }
            }}
            onBlur={updateDate}
            className="w-full px-3 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 text-center"
            placeholder="Kun"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={month}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                setMonth(val);
              }
            }}
            onBlur={updateDate}
            className="w-full px-3 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 text-center"
            placeholder="Oy"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={year}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setYear(val);
            }}
            onBlur={updateDate}
            className="w-full px-3 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 text-center"
            placeholder="Yil"
            maxLength={4}
          />
        </div>
      </div>
    );
  };

  const selectedCashier = JSON.parse(localStorage.getItem('selectedCashier') || '{}');
  const currentCashierId = selectedCashier?._id;

  useEffect(() => {
    fetchExchangeRate(); // CBU'dan valyuta kursini olish
    if (activeTab === 'receivable') {
      loadDebts();
      loadAllCustomers();
    } else {
      loadMyDebts();
    }
  }, [activeTab]);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url = currentCashierId
        ? `/api/customers/debts/by-cashier/${currentCashierId}`
        : '/api/customers/debts/all';

      console.log('Loading debts from:', url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Debts response:', data);
      if (data.success) {
        if (currentCashierId && data.data) {
          const customerMap = new Map<string, Customer>();
          data.data.forEach((debt: any) => {
            const customerId = debt.customerId?.toString() || debt.customerId;
            const existing = customerMap.get(customerId);
            if (existing) {
              existing.currentDebt += debt.amount;
            } else {
              customerMap.set(customerId, {
                _id: customerId,
                fullName: debt.customerName,
                phone: debt.customerPhone,
                currentDebt: debt.amount,
                debtDueDate: debt.dueDate,
                createdAt: debt.createdAt,
                addedBy: selectedCashier?.fullName || 'Kassir',
              });
            }
          });
          const customersArray = Array.from(customerMap.values());
          setCustomers(customersArray);
          calculateStats(customersArray);
        } else {
          // Admin panel - to'g'ridan-to'g'ri customer ma'lumotlari
          const customersWithStringId = (data.data || []).map((c: any) => ({
            ...c,
            _id: c._id?.toString() || c._id,
          }));
          console.log('Customers with string ID:', customersWithStringId);
          setCustomers(customersWithStringId);
          calculateStats(customersWithStringId);
        }
      }
    } catch (error) {
      console.error('Load debts error:', error);
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadAllCustomers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setAllCustomers(data.data || []);
    } catch (error) {
      console.error('Load customers error:', error);
    }
  };

  const calculateStats = (data: Customer[]) => {
    let pending = 0, todayDue = 0, paid = 0, overdue = 0, total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    data.forEach((c) => {
      total += c.currentDebt;
      if (c.currentDebt === 0) { paid++; return; }
      if (c.debtDueDate) {
        const dueDate = new Date(c.debtDueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) overdue++;
        else if (dueDate >= today && dueDate < tomorrow) todayDue++;
        else pending++;
      } else {
        pending++;
      }
    });
    setStats({ pending, todayDue, paid, overdue, total });
  };

  const loadMyDebts = async () => {
    setMyDebtsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/my-debts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMyDebts(data.data || []);
        calculateMyDebtsStats(data.data || []);
      } else {
        const saved = localStorage.getItem('myDebts');
        const debts = saved ? JSON.parse(saved) : [];
        setMyDebts(debts);
        calculateMyDebtsStats(debts);
      }
    } catch (error) {
      const saved = localStorage.getItem('myDebts');
      const debts = saved ? JSON.parse(saved) : [];
      setMyDebts(debts);
      calculateMyDebtsStats(debts);
    } finally {
      setMyDebtsLoading(false);
    }
  };

  const calculateMyDebtsStats = (data: MyDebt[]) => {
    let pending = 0, todayDue = 0, paid = 0, overdue = 0, total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    data.forEach((d) => {
      total += d.remainingAmount;
      if (d.remainingAmount === 0) { paid++; return; }
      if (d.dueDate) {
        const dueDate = new Date(d.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) overdue++;
        else if (dueDate >= today && dueDate < tomorrow) todayDue++;
        else pending++;
      } else {
        pending++;
      }
    });
    setMyDebtsStats({ pending, todayDue, paid, overdue, total });
  };

  const handleAddMyDebt = async () => {
    if (!myDebtForm.creditorName || (!myDebtForm.amountUzs && !myDebtForm.amountUsd)) {
      toast.error(t('errors.requiredField'));
      return;
    }

    const finalAmount = parseFloat(myDebtForm.amountUzs) || 0;
    const initialPayment = parseFloat(myDebtForm.initialPaymentUzs) || 0;

    // Boshlang'ich to'lovni tekshirish
    if (initialPayment > finalAmount) {
      toast.error("Boshlang'ich to'lov jami summadan katta bo'lishi mumkin emas");
      return;
    }

    // Agar boshlang'ich to'lov jami summaga teng bo'lsa, ogohlantirish
    if (initialPayment === finalAmount && finalAmount > 0) {
      if (!window.confirm("Boshlang'ich to'lov jami summaga teng. Bu holda qarz qolmaydi. Davom etasizmi?")) {
        return;
      }
    }

    const newDebtData = {
      creditorName: myDebtForm.creditorName,
      creditorPhone: myDebtForm.creditorPhone,
      amount: finalAmount,
      initialPayment: initialPayment,
      dueDate: myDebtForm.dueDate || undefined,
      notes: myDebtForm.notes,
      type: myDebtForm.type,
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/my-debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newDebtData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Qarz qo'shildi");
        loadMyDebts();
      } else {
        // Fallback to localStorage
        addMyDebtLocal(finalAmount, initialPayment);
      }
    } catch {
      // Fallback to localStorage
      addMyDebtLocal(finalAmount, initialPayment);
    }

    setShowAddMyDebtModal(false);
    setMyDebtForm({
      creditorName: '',
      creditorPhone: '',
      amountUsd: '',
      amountUzs: '',
      dueDate: '',
      notes: '',
      type: 'supplier',
      initialPaymentUsd: '',
      initialPaymentUzs: ''
    });
  };

  const addMyDebtLocal = (finalAmount: number, initialPayment: number = 0) => {
    const remainingAmount = finalAmount - initialPayment;
    const payments = [];

    // Agar boshlang'ich to'lov bo'lsa, uni to'lov sifatida qo'shamiz
    if (initialPayment > 0) {
      payments.push({
        _id: `initial_payment_${Date.now()}`,
        amount: initialPayment,
        paidAt: new Date().toISOString(),
        notes: `Boshlang'ich to'lov - qarz belgilanayotgan paytda to'landi`,
        type: 'full' as 'full',
      });
    }

    const newDebt: MyDebt = {
      _id: `debt_${Date.now()}`,
      creditorName: myDebtForm.creditorName,
      creditorPhone: myDebtForm.creditorPhone,
      amount: finalAmount,
      paidAmount: initialPayment,
      remainingAmount: remainingAmount,
      dueDate: myDebtForm.dueDate || undefined,
      notes: myDebtForm.notes,
      createdAt: new Date().toISOString(),
      type: myDebtForm.type,
      payments: payments,
      status: remainingAmount === 0 ? 'paid' : 'active',
    };

    const saved = localStorage.getItem('myDebts');
    const debts = saved ? JSON.parse(saved) : [];
    debts.push(newDebt);
    localStorage.setItem('myDebts', JSON.stringify(debts));
    setMyDebts(debts);
    calculateMyDebtsStats(debts);

    let message = "Qarz qo'shildi";
    if (initialPayment > 0) {
      if (remainingAmount === 0) {
        message = `Qarz to'liq to'landi! Boshlang'ich to'lov: ${initialPayment.toLocaleString()} so'm`;
      } else {
        message = `Qarz qo'shildi. Boshlang'ich to'lov: ${initialPayment.toLocaleString()} so'm. Qoldiq: ${remainingAmount.toLocaleString()} so'm`;
      }
    }
    toast.success(message);
  };

  const handlePayMyDebt = async () => {
    if (!selectedMyDebt || !payAmount) return;

    const amount = parseFloat(payAmount);
    if (amount <= 0 || amount > selectedMyDebt.remainingAmount) {
      toast.error("Noto'g'ri summa kiritildi");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/my-debts/${selectedMyDebt._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();

      if (data.success) {
        const updatedDebt = data.data;
        setMyDebts(prev => prev.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));
        calculateMyDebtsStats(myDebts.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));

        if (updatedDebt.remainingAmount === 0) {
          toast.success("Qarz to'liq to'landi! ✅");
        } else {
          toast.success(`${formatMoney(amount)} so'm to'landi`);
        }
        setShowPayMyDebtModal(false);
        setSelectedMyDebt(updatedDebt);
        setShowMyDebtDetailModal(true);
        setPayAmount('');
      } else {
        // Fallback to localStorage
        handlePayMyDebtLocal(amount);
      }
    } catch {
      // Fallback to localStorage
      handlePayMyDebtLocal(parseFloat(payAmount));
    }
  };

  const handlePartialPayMyDebt = async () => {
    if (!selectedMyDebt || !partialPayForm.amount || !partialPayForm.recipientName) {
      toast.error("Summa va qabul qiluvchi nomi kiritilishi shart");
      return;
    }

    const amount = parseFloat(partialPayForm.amount);
    if (amount <= 0 || amount > selectedMyDebt.remainingAmount) {
      toast.error("Noto'g'ri summa kiritildi");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/my-debts/${selectedMyDebt._id}/partial-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount,
          recipientName: partialPayForm.recipientName,
          recipientPhone: partialPayForm.recipientPhone,
          notes: partialPayForm.notes
        }),
      });
      const data = await response.json();

      if (data.success) {
        const updatedDebt = data.data;
        setMyDebts(prev => prev.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));
        calculateMyDebtsStats(myDebts.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));

        toast.success(data.message || `${formatMoney(amount)} so'm qisman to'lov qilindi`);
        setShowPartialPayModal(false);
        setSelectedMyDebt(updatedDebt);
        setShowMyDebtDetailModal(true);
        setPartialPayForm({ amount: '', recipientName: '', recipientPhone: '', notes: '' });
      } else {
        // Fallback to localStorage
        handlePartialPayMyDebtLocal(amount);
      }
    } catch {
      // Fallback to localStorage
      handlePartialPayMyDebtLocal(amount);
    }
  };

  const handlePartialPayMyDebtLocal = (amount: number) => {
    if (!selectedMyDebt) return;

    const newPayment: MyDebtPayment = {
      _id: `partial_payment_${Date.now()}`,
      amount: amount,
      paidAt: new Date().toISOString(),
      recipientName: partialPayForm.recipientName,
      recipientPhone: partialPayForm.recipientPhone,
      notes: partialPayForm.notes || `Qisman to'lov - ${partialPayForm.recipientName}`,
      type: 'partial',
    };

    const newRemainingAmount = selectedMyDebt.remainingAmount - amount;
    const updatedDebt: MyDebt = {
      ...selectedMyDebt,
      paidAmount: selectedMyDebt.paidAmount + amount,
      remainingAmount: newRemainingAmount,
      payments: [...(selectedMyDebt.payments || []), newPayment],
      status: newRemainingAmount === 0 ? 'paid' : 'active',
    };

    const saved = localStorage.getItem('myDebts');
    const debts: MyDebt[] = saved ? JSON.parse(saved) : [];
    const idx = debts.findIndex(d => d._id === selectedMyDebt._id);
    if (idx !== -1) {
      debts[idx] = updatedDebt;
      localStorage.setItem('myDebts', JSON.stringify(debts));
    }

    setMyDebts(prev => prev.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));
    calculateMyDebtsStats(myDebts.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));

    toast.success(`${formatMoney(amount)} so'm qisman to'lov qilindi`);
    setShowPartialPayModal(false);
    setSelectedMyDebt(updatedDebt);
    setShowMyDebtDetailModal(true);
    setPartialPayForm({ amount: '', recipientName: '', recipientPhone: '', notes: '' });
  };

  const handlePayMyDebtLocal = (amount: number) => {
    if (!selectedMyDebt) return;

    const newPayment: MyDebtPayment = {
      _id: `payment_${Date.now()}`,
      amount: amount,
      paidAt: new Date().toISOString(),
    };

    const newRemainingAmount = selectedMyDebt.remainingAmount - amount;
    const updatedDebt: MyDebt = {
      ...selectedMyDebt,
      paidAmount: selectedMyDebt.paidAmount + amount,
      remainingAmount: newRemainingAmount,
      payments: [...(selectedMyDebt.payments || []), newPayment],
      status: newRemainingAmount === 0 ? 'paid' : 'active',
    };

    const saved = localStorage.getItem('myDebts');
    const debts: MyDebt[] = saved ? JSON.parse(saved) : [];
    const idx = debts.findIndex(d => d._id === selectedMyDebt._id);
    if (idx !== -1) {
      debts[idx] = updatedDebt;
      localStorage.setItem('myDebts', JSON.stringify(debts));
    }

    setMyDebts(prev => prev.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));
    calculateMyDebtsStats(myDebts.map(d => d._id === selectedMyDebt._id ? updatedDebt : d));

    if (newRemainingAmount === 0) {
      toast.success("Qarz to'liq to'landi! ✅");
    } else {
      toast.success(`${formatMoney(amount)} so'm to'landi`);
    }
    setShowPayMyDebtModal(false);
    setSelectedMyDebt(updatedDebt);
    setShowMyDebtDetailModal(true);
    setPayAmount('');
  };

  const handleDeleteMyDebt = async (debt: MyDebt) => {
    if (!window.confirm(`${debt.creditorName} - qarzni o'chirmoqchimisiz?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/my-debts/${debt._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setMyDebts(prev => prev.filter(d => d._id !== debt._id));
        calculateMyDebtsStats(myDebts.filter(d => d._id !== debt._id));
        toast.success("Qarz o'chirildi");
      } else {
        // Fallback to localStorage
        deleteMyDebtLocal(debt);
      }
    } catch {
      // Fallback to localStorage
      deleteMyDebtLocal(debt);
    }
  };

  const deleteMyDebtLocal = (debt: MyDebt) => {
    const saved = localStorage.getItem('myDebts');
    const debts: MyDebt[] = saved ? JSON.parse(saved) : [];
    const filtered = debts.filter(d => d._id !== debt._id);
    localStorage.setItem('myDebts', JSON.stringify(filtered));
    setMyDebts(filtered);
    calculateMyDebtsStats(filtered);
    toast.success("Qarz o'chirildi");
  };

  const getCustomerStatus = (customer: Customer): 'pending' | 'overdue' | 'today' | 'paid' => {
    if (customer.currentDebt === 0) return 'paid';
    if (!customer.debtDueDate) return 'pending';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(customer.debtDueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return 'overdue';
    if (dueDate >= today && dueDate < tomorrow) return 'today';
    return 'pending';
  };

  const handleAddDebt = async () => {
    // Kafil ma'lumotlarini tayyorlash
    const guarantorData = showGuarantorSection && guarantorForm.fullName ? {
      fullName: guarantorForm.fullName,
      phone: guarantorForm.phone || undefined,
      address: guarantorForm.address || undefined,
    } : undefined;

    // Boshlang'ich to'lovni tekshirish
    const initialPayment = parseFloat(form.initialPaymentUzs) || 0;
    const totalAmount = parseFloat(form.amountUzs) || 0;

    // Boshlang'ich to'lov jami summadan katta bo'lmasligi kerak
    if (initialPayment > totalAmount) {
      toast.error("Boshlang'ich to'lov jami summadan katta bo'lishi mumkin emas");
      return;
    }

    // Agar boshlang'ich to'lov jami summaga teng bo'lsa, ogohlantirish
    if (initialPayment === totalAmount && totalAmount > 0) {
      if (!window.confirm("Boshlang'ich to'lov jami summaga teng. Bu holda qarz qolmaydi. Davom etasizmi?")) {
        return;
      }
    }

    // Yangi mijoz qo'shish rejimi
    if (newCustomerMode) {
      if (!newCustomerForm.fullName || (!form.amountUzs && !form.amountUsd)) {
        toast.error(t('errors.requiredField'));
        return;
      }
      const finalAmount = totalAmount;
      try {
        const token = localStorage.getItem('accessToken');
        // Avval yangi mijoz yaratamiz
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            fullName: newCustomerForm.fullName,
            phone: newCustomerForm.phone || undefined
          }),
        });
        const customerData = await customerResponse.json();
        if (!customerData.success) {
          toast.error(customerData.message || t('common.error'));
          return;
        }
        const newCustomerId = customerData.data._id;

        // Keyin qarz qo'shamiz (kafil va bo'lib to'lash bilan)
        const response = await fetch(`/api/customers/${newCustomerId}/add-debt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            amount: finalAmount,
            initialPayment: initialPayment, // Boshlang'ich to'lovni qo'shamiz
            dueDate: form.dueDate || undefined,
            notes: form.notes || undefined,
            cashierId: currentCashierId || undefined,
            guarantor: guarantorData,
            isInstallment: isInstallment,
            installmentCount: isInstallment ? installmentCount : undefined,
            installmentDates: isInstallment ? installmentDates : undefined,
          }),
        });
        const data = await response.json();
        if (data.success) {
          if (initialPayment > 0) {
            toast.success(`Qarz qo'shildi. Boshlang'ich to'lov: ${initialPayment.toLocaleString()} so'm`);
          } else {
            toast.success(t('debts.debtAdded'));
          }
          setShowAddModal(false);
          setForm({ customerId: '', amountUsd: '', amountUzs: '', dueDate: '', notes: '', initialPaymentUsd: '', initialPaymentUzs: '' });
          setNewCustomerForm({ fullName: '', phone: '' });
          setGuarantorForm({ fullName: '', phone: '', address: '' });
          setShowGuarantorSection(false);
          setIsInstallment(false);
          setInstallmentCount(2);
          setInstallmentDates([]);
          setNewCustomerMode(false);
          setCustomerSearch('');
          loadDebts();
          loadAllCustomers();
        } else {
          toast.error(data.message || t('common.error'));
        }
      } catch (error) {
        toast.error(t('errors.somethingWentWrong'));
      }
      return;
    }

    // Mavjud mijozga qarz qo'shish
    if (!form.customerId || (!form.amountUzs && !form.amountUsd)) {
      toast.error(t('errors.requiredField'));
      return;
    }
    const finalAmount = totalAmount;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${form.customerId}/add-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: finalAmount,
          initialPayment: initialPayment, // Boshlang'ich to'lovni qo'shamiz
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
          cashierId: currentCashierId || undefined,
          guarantor: guarantorData,
          isInstallment: isInstallment,
          installmentCount: isInstallment ? installmentCount : undefined,
          installmentDates: isInstallment ? installmentDates : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (initialPayment > 0) {
          toast.success(`Qarz qo'shildi. Boshlang'ich to'lov: ${initialPayment.toLocaleString()} so'm`);
        } else {
          toast.success(t('debts.debtAdded'));
        }
        setShowAddModal(false);
        setForm({ customerId: '', amountUsd: '', amountUzs: '', dueDate: '', notes: '', initialPaymentUsd: '', initialPaymentUzs: '' });
        setGuarantorForm({ fullName: '', phone: '', address: '' });
        setShowGuarantorSection(false);
        setIsInstallment(false);
        setInstallmentCount(2);
        setInstallmentDates([]);
        setCustomerSearch('');
        loadDebts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handlePayDebt = async () => {
    if (!selectedCustomer || !payAmount) {
      toast.error(t('errors.requiredField'));
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${selectedCustomer._id}/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          cashierId: currentCashierId || undefined,
          receivedBy: payReceivedBy || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('debts.debtPaid'));
        setShowPayModal(false);
        setShowCustomerDetailModal(false);
        setSelectedCustomer(null);
        setPayAmount('');
        setPayReceivedBy('');
        loadDebts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleDeleteDebt = async (customer: Customer) => {
    if (!window.confirm(`${customer.fullName} ${t('debts.confirmDelete')}`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Deleting debt for customer:', customer._id);
      const response = await fetch(`/api/customers/${customer._id}/delete-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: t('debts.debtDeleted'), cashierId: currentCashierId || undefined }),
      });
      const data = await response.json();
      console.log('Delete response:', data);
      if (data.success) {
        toast.success(t('debts.debtDeleted'));
        loadDebts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Delete debt error:', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const loadDebtHistory = async (customer: Customer) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${customer._id}/debt-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setDebtHistory(data.data || []);
    } catch (error) {
      console.error('Load history error:', error);
    }
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const openPayModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPayAmount('');
    setShowPayModal(true);
  };

  // Mijozlarni tartiblash - muddati o'tganlar yuqorida
  const sortCustomersByPriority = (customers: Customer[]) => {
    return [...customers].sort((a, b) => {
      const statusA = getCustomerStatus(a);
      const statusB = getCustomerStatus(b);

      // Prioritet: overdue > today > pending > paid
      const priority: Record<string, number> = { overdue: 0, today: 1, pending: 2, paid: 3 };

      if (priority[statusA] !== priority[statusB]) {
        return priority[statusA] - priority[statusB];
      }

      // Bir xil statusda bo'lsa, qarz summasiga qarab (kattasi yuqorida)
      return b.currentDebt - a.currentDebt;
    });
  };

  const filteredCustomers = sortCustomersByPriority(
    customers.filter((c) => {
      const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone && c.phone.includes(searchQuery));
      if (activeFilter === 'all') return matchesSearch;
      return matchesSearch && getCustomerStatus(c) === activeFilter;
    })
  );

  // Men qarzdorman ro'yxatini ham tartiblash
  const sortMyDebtsByPriority = (debts: MyDebt[]) => {
    return [...debts].sort((a, b) => {
      const statusA = getMyDebtStatus(a);
      const statusB = getMyDebtStatus(b);

      const priority: Record<string, number> = { overdue: 0, pending: 1, paid: 2 };

      if (priority[statusA] !== priority[statusB]) {
        return priority[statusA] - priority[statusB];
      }

      return b.remainingAmount - a.remainingAmount;
    });
  };

  const filteredMyDebts = sortMyDebtsByPriority(
    myDebts.filter((d) => {
      return d.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.creditorPhone && d.creditorPhone.includes(searchQuery));
    })
  );

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('uz-UZ');
  const formatMoney = (amount: number) => amount.toLocaleString('uz-UZ');

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (customer: Customer) => {
    const status = getCustomerStatus(customer);
    const days = getDaysRemaining(customer.debtDueDate);
    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <AlertCircle className="w-3 h-3" />
            {days !== null ? `${Math.abs(days)} ${convertToLanguage("kun o'tgan", language)}` : convertToLanguage("Muddati o'tgan", language)}
          </span>
        );
      case 'today':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            {convertToLanguage('Bugun', language)}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            {days !== null ? `${days} ${convertToLanguage('kun qoldi', language)}` : convertToLanguage('Kutilmoqda', language)}
          </span>
        );
    }
  };

  const getMyDebtStatus = (debt: MyDebt) => {
    if (debt.remainingAmount === 0) return 'paid';
    if (!debt.dueDate) return 'pending';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(debt.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  const currentStats = activeTab === 'receivable' ? stats : myDebtsStats;


  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('receivable')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'receivable'
                ? 'bg-white text-cyan-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              {convertToLanguage('Menga qarzdor', language)}
            </button>
            <button
              onClick={() => setActiveTab('payable')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payable'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              {convertToLanguage('Men qarzdorman', language)}
            </button>
          </div>

          {/* Search & Add */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={convertToLanguage('Qidirish...', language)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/50 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={() => activeTab === 'receivable' ? setShowAddModal(true) : setShowAddMyDebtModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-500/25 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{convertToLanguage('Yangi qarz', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{convertToLanguage('Kutilmoqda', language)}</p>
                <p className="text-lg font-bold text-gray-900">{currentStats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{convertToLanguage("Bugun to'lanadigan", language)}</p>
                <p className="text-lg font-bold text-gray-900">{currentStats.todayDue}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{convertToLanguage("To'langan", language)}</p>
                <p className="text-lg font-bold text-gray-900">{currentStats.paid}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{convertToLanguage("Muddati o'tgan", language)}</p>
                <p className="text-lg font-bold text-gray-900">{currentStats.overdue}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-xl p-3 col-span-2 sm:col-span-1 ${activeTab === 'receivable' ? 'bg-gradient-to-br from-cyan-500 to-teal-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80">{convertToLanguage('Jami qarz', language)}</p>
                <p className="text-lg font-bold text-white">{formatMoney(currentStats.total)} {convertToLanguage("so'm", language)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-auto">
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
          {/* MENGA QARZDOR TAB */}
          {activeTab === 'receivable' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">{convertToLanguage('Qarzlar topilmadi', language)}</p>
                  <p className="text-gray-400 text-sm mt-1">{convertToLanguage("Hozircha qarzlar yo'q", language)}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => {
                    const status = getCustomerStatus(customer);
                    const isOverdue = status === 'overdue';
                    return (
                      <div
                        key={customer._id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${isOverdue
                          ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-l-4 border-l-red-500'
                          : status === 'today'
                            ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-l-amber-500'
                            : ''
                          }`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          setSelectedCustomer(customer);
                          loadDebtHistory(customer);
                          setShowCustomerDetailModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30' :
                            status === 'today' ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30' :
                              'bg-gradient-to-br from-cyan-400 to-teal-500'
                            }`}>
                            {isOverdue ? <AlertCircle className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                              {convertToLanguage(customer.fullName, language)}
                            </p>
                            {customer.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{customer.phone}
                              </p>
                            )}
                          </div>
                          <div className="text-right min-w-0">
                            <div className="space-y-2">
                              {/* Faqat joriy qarz ko'rsatamiz, chunki boshqa ma'lumotlar yo'q */}
                              <div className={`text-center p-3 rounded-lg border ${
                                isOverdue ? 'bg-red-50 border-red-200' : 
                                status === 'today' ? 'bg-amber-50 border-amber-200' : 
                                'bg-blue-50 border-blue-200'
                              }`}>
                                <p className={`text-xs font-medium ${
                                  isOverdue ? 'text-red-600' : 
                                  status === 'today' ? 'text-amber-600' : 
                                  'text-blue-600'
                                }`}>{convertToLanguage('Joriy qarz', language)}</p>
                                <p className={`text-lg font-bold ${
                                  isOverdue ? 'text-red-700' : 
                                  status === 'today' ? 'text-amber-700' : 
                                  'text-blue-700'
                                }`}>
                                  {formatMoney(customer.currentDebt)} {convertToLanguage("so'm", language)}
                                </p>
                              </div>

                              {/* Status badge */}
                              <div className="mt-2">
                                {getStatusBadge(customer)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => loadDebtHistory(customer)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                              <History className="w-4 h-4" />
                            </button>
                            <button onClick={() => openPayModal(customer)} className={`p-2 rounded-lg ${isOverdue ? 'text-red-600 hover:bg-red-100' : 'text-cyan-600 hover:bg-cyan-100'}`}>
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteDebt(customer)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {isOverdue && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>Muddati {Math.abs(getDaysRemaining(customer.debtDueDate) || 0)} kun oldin o'tgan!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* MEN QARZDORMAN TAB */}
          {activeTab === 'payable' && (
            <>
              {myDebtsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredMyDebts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ArrowUpRight className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">{convertToLanguage('Qarzlar topilmadi', language)}</p>
                  <p className="text-gray-400 text-sm mt-1">{convertToLanguage('Siz hech kimga qarzdor emassiz', language)}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMyDebts.map((debt) => {
                    const status = getMyDebtStatus(debt);
                    const isPaid = debt.remainingAmount === 0;
                    return (
                      <div
                        key={debt._id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${status === 'overdue' ? 'bg-red-50/30' :
                          isPaid ? 'bg-emerald-50/30' : ''
                          }`}
                        onClick={(e) => {
                          // Agar tugma bosilgan bo'lsa, modal ochilmasin
                          if ((e.target as HTMLElement).closest('button')) return;
                          setSelectedMyDebt(debt);
                          setShowMyDebtDetailModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                            debt.type === 'supplier' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                              debt.type === 'person' ? 'bg-gradient-to-br from-purple-400 to-violet-500' :
                                'bg-gradient-to-br from-gray-400 to-slate-500'
                            }`}>
                            {isPaid ? <CheckCircle className="w-5 h-5 text-white" /> :
                              debt.type === 'supplier' ? <Building className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${isPaid ? 'text-emerald-700' : 'text-gray-900'}`}>{debt.creditorName}</p>
                            {debt.creditorPhone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{debt.creditorPhone}
                              </p>
                            )}
                          </div>
                          <div className="text-right min-w-0">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                                <CheckCircle className="w-4 h-4" />
                                {convertToLanguage("To'langan", language)}
                              </span>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {/* 1. Jami qarz */}
                                <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-xs text-blue-600 font-medium">{convertToLanguage('Jami', language)}</p>
                                  <p className="text-sm font-bold text-blue-700">{formatMoney(debt.amount)}</p>
                                </div>
                                
                                {/* 2. To'langan */}
                                <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                                  <p className="text-xs text-emerald-600 font-medium">{convertToLanguage("To'langan", language)}</p>
                                  <p className="text-sm font-bold text-emerald-700">{formatMoney(debt.paidAmount)}</p>
                                </div>
                                
                                {/* 3. Qoldiq */}
                                <div className={`text-center p-2 rounded-lg border ${status === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                                  <p className={`text-xs font-medium ${status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>{convertToLanguage('Qoldiq', language)}</p>
                                  <p className={`text-sm font-bold ${status === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>{formatMoney(debt.remainingAmount)}</p>
                                </div>
                              </div>
                            )}
                            {debt.dueDate && !isPaid && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full mt-2 ${status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                <Calendar className="w-3 h-3" />
                                {formatDate(debt.dueDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!isPaid && (
                              <>
                                <button
                                  onClick={() => { setSelectedMyDebt(debt); setPayAmount(''); setShowPayMyDebtModal(true); }}
                                  className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-lg"
                                  title={convertToLanguage("To'lov qilish", language)}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMyDebt(debt);
                                    setPartialPayForm({ amount: '', recipientName: '', recipientPhone: '', notes: '' });
                                    setShowPartialPayModal(true);
                                  }}
                                  className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg"
                                  title={convertToLanguage(t('debts.partialPay'), language)}
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDeleteMyDebt(debt)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title={convertToLanguage("O'chirish", language)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* To'lovlar progress bar */}
                        {debt.paidAmount > 0 && debt.amount > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{convertToLanguage("To'lov jarayoni", language)}</span>
                              <span>{Math.round((debt.paidAmount / debt.amount) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isPaid ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                                style={{ width: `${Math.min(100, (debt.paidAmount / debt.amount) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {debt.notes && (
                          <p className="mt-2 text-sm text-gray-500">{debt.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* ==================== MODALS ==================== */}

      {/* Pay Modal (Receivable) */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-cyan-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">{convertToLanguage("Qarz to'lash", language)}</h3>
              <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="font-semibold text-gray-900">{convertToLanguage(selectedCustomer.fullName, language)}</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{formatMoney(selectedCustomer.currentDebt)} {convertToLanguage("so'm", language)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{convertToLanguage("To'lov summasi", language)}</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-cyan-500" placeholder="0" autoFocus />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPayAmount(Math.floor(selectedCustomer.currentDebt / 2).toString())} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200">50%</button>
                <button onClick={() => setPayAmount(selectedCustomer.currentDebt.toString())} className="flex-1 py-3 bg-cyan-100 text-cyan-700 rounded-xl text-sm font-semibold hover:bg-cyan-200">{convertToLanguage('Hammasi', language)}</button>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowPayModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200">{convertToLanguage('Bekor', language)}</button>
              <button onClick={handlePayDebt} className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold">{convertToLanguage("To'lash", language)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal (Receivable) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-cyan-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">{convertToLanguage("Yangi qarz qo'shish", language)}</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setNewCustomerMode(false);
                setCustomerSearch('');
                setForm({ customerId: '', amountUsd: '', amountUzs: '', dueDate: '', notes: '', initialPaymentUsd: '', initialPaymentUzs: '' });
                setGuarantorForm({ fullName: '', phone: '', address: '' });
                setShowGuarantorSection(false);
                setIsInstallment(false);
                setInstallmentCount(2);
                setInstallmentDates([]);
              }} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Mijoz tanlash yoki yangi qo'shish */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">{convertToLanguage('Mijoz', language)} *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerMode(!newCustomerMode);
                      setForm({ ...form, customerId: '' });
                      setCustomerSearch('');
                    }}
                    className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${newCustomerMode
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {newCustomerMode ? 'Mavjud mijoz' : '+ Yangi mijoz'}
                  </button>
                </div>

                {newCustomerMode ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newCustomerForm.fullName}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500"
                      placeholder="Ism familiya *"
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+998</span>
                      <input
                        type="tel"
                        value={newCustomerForm.phone.replace('+998', '')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setNewCustomerForm({ ...newCustomerForm, phone: value ? `+998${value}` : '' });
                        }}
                        className="w-full pl-16 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500"
                        placeholder="XX XXX XX XX"
                        maxLength={9}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Qidiruv inputi */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500"
                        placeholder="Ism yoki telefon raqam bilan qidiring..."
                      />
                    </div>
                    {/* Filterlangan mijozlar ro'yxati */}
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200">
                      {allCustomers
                        .filter(c => {
                          if (!customerSearch) return true;
                          const search = customerSearch.toLowerCase();
                          const phoneSearch = customerSearch.replace(/\D/g, '');
                          return c.fullName.toLowerCase().includes(search) ||
                            (c.phone && c.phone.replace(/\D/g, '').includes(phoneSearch));
                        })
                        .map((c) => (
                          <div
                            key={c._id}
                            onClick={() => {
                              setForm({ ...form, customerId: c._id });
                              setCustomerSearch(c.fullName + (c.phone ? ` (${c.phone})` : ''));
                            }}
                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${form.customerId === c._id ? 'bg-cyan-50' : ''
                              }`}
                          >
                            <p className="font-medium text-gray-900">{convertToLanguage(c.fullName, language)}</p>
                            {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                          </div>
                        ))}
                      {allCustomers.filter(c => {
                        if (!customerSearch) return true;
                        const search = customerSearch.toLowerCase();
                        const phoneSearch = customerSearch.replace(/\D/g, '');
                        return c.fullName.toLowerCase().includes(search) ||
                          (c.phone && c.phone.replace(/\D/g, '').includes(phoneSearch));
                      }).length === 0 && (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            Mijoz topilmadi
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
              {/* Currency Rate */}
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Kurs: 1 $ =</span>
                  <span className="text-xs text-blue-500">(CBU)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(parseFloat(e.target.value) || 12500)}
                    className="w-28 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-700">UZS</span>
                  <button
                    type="button"
                    onClick={fetchExchangeRate}
                    disabled={rateLoading}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    title="CBU'dan yangilash"
                  >
                    <RefreshCw className={`w-4 h-4 ${rateLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qarz summasi *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input type="number" value={form.amountUsd} onChange={(e) => handleAmountUsdChange(e.target.value, 'receivable')} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 pr-14" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input type="number" value={form.amountUzs} onChange={(e) => handleAmountUzsChange(e.target.value, 'receivable')} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 pr-14" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              {/* Boshlang'ich to'lov */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <label className="text-sm font-semibold text-blue-700">
                    {convertToLanguage(t('debts.initialPaymentOptional'), language)}
                  </label>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  {convertToLanguage("Qarz belgilanayotgan paytda darhol to'lanadigan summa", language)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={form.initialPaymentUsd}
                      onChange={(e) => handleInitialPaymentUsdChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.initialPaymentUzs}
                      onChange={(e) => handleInitialPaymentUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">UZS</span>
                  </div>
                </div>

                {/* Qoldiq qarzni ko'rsatish */}
                {(form.amountUzs || form.initialPaymentUzs) && (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{convertToLanguage(t('debts.totalDebtAmount'), language)}:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {(parseFloat(form.amountUzs) || 0).toLocaleString()} {convertToLanguage("so'm", language)}
                        </span>
                      </div>
                      {form.initialPaymentUzs && parseFloat(form.initialPaymentUzs) > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-700">{convertToLanguage(t('debts.initialPayment'), language)}:</span>
                            <span className="text-sm font-bold text-blue-700">
                              -{(parseFloat(form.initialPaymentUzs) || 0).toLocaleString()} {convertToLanguage("so'm", language)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                            <span className="text-sm font-semibold text-cyan-700">{convertToLanguage(t('debts.remainingDebt'), language)}:</span>
                            <span className="text-lg font-bold text-cyan-700">
                              {((parseFloat(form.amountUzs) || 0) - (parseFloat(form.initialPaymentUzs) || 0)).toLocaleString()} {convertToLanguage("so'm", language)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To'lov muddati</label>
                <SimpleDateInput 
                  value={form.dueDate} 
                  onChange={(value) => setForm({ ...form, dueDate: value })} 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Izoh</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 resize-none" rows={2} />
              </div>

              {/* Kafil (Guarantor) Section */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGuarantorSection(!showGuarantorSection)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${showGuarantorSection
                    ? 'bg-amber-50 border-2 border-amber-300'
                    : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${showGuarantorSection ? 'text-amber-600' : 'text-gray-500'}`} />
                    <span className={`text-sm font-semibold ${showGuarantorSection ? 'text-amber-700' : 'text-gray-600'}`}>
                      Kafil qo'shish
                    </span>
                  </div>
                  <span className={`text-xs ${showGuarantorSection ? 'text-amber-600' : 'text-gray-400'}`}>
                    {showGuarantorSection ? 'Yopish' : 'Ixtiyoriy'}
                  </span>
                </button>

                {showGuarantorSection && (
                  <div className="mt-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                    <p className="text-xs text-amber-700 mb-2">
                      Kafil - qarz oluvchi to'lay olmasa, uning o'rniga to'laydigan shaxs
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Kafil ism familiyasi *</label>
                      <input
                        type="text"
                        value={guarantorForm.fullName}
                        onChange={(e) => setGuarantorForm({ ...guarantorForm, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Ism familiya"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon raqami</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+998</span>
                        <input
                          type="tel"
                          value={guarantorForm.phone.replace('+998', '')}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setGuarantorForm({ ...guarantorForm, phone: value ? `+998${value}` : '' });
                          }}
                          className="w-full pl-16 pr-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm"
                          placeholder="XX XXX XX XX"
                          maxLength={9}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Manzil</label>
                      <input
                        type="text"
                        value={guarantorForm.address}
                        onChange={(e) => setGuarantorForm({ ...guarantorForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="Manzil (tuman, ko'cha, uy)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bo'lib to'lash (Installment) Section */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsInstallment(!isInstallment);
                    if (!isInstallment) {
                      // Default sanalarni yaratish
                      const dates: string[] = [];
                      for (let i = 0; i < installmentCount; i++) {
                        const date = new Date();
                        date.setMonth(date.getMonth() + i + 1);
                        dates.push(date.toISOString().split('T')[0]);
                      }
                      setInstallmentDates(dates);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isInstallment
                    ? 'bg-purple-50 border-2 border-purple-300'
                    : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isInstallment ? 'text-purple-600' : 'text-gray-500'}`} />
                    <span className={`text-sm font-semibold ${isInstallment ? 'text-purple-700' : 'text-gray-600'}`}>Bo'lib to'lash</span>
                  </div>
                  <span className={`text-xs ${isInstallment ? 'text-purple-600' : 'text-gray-400'}`}>{isInstallment ? 'Yopish' : 'Ixtiyoriy'}</span>
                </button>

                {isInstallment && (
                  <div className="mt-3 p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
                    <p className="text-xs text-purple-700 mb-2">Qarzni necha bo'lakka bo'lish kerak? Har bir bo'lak uchun sanani o'zgartirishingiz mumkin.</p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Bo'laklar soni</label>
                      <input
                        type="number"
                        min="2"
                        max="36"
                        value={installmentCount}
                        onChange={(e) => {
                          const val = Math.min(36, Math.max(2, parseInt(e.target.value) || 2));
                          setInstallmentCount(val);
                          // Sanalarni yangilash
                          const dates: string[] = [];
                          for (let i = 0; i < val; i++) {
                            if (installmentDates[i]) {
                              dates.push(installmentDates[i]);
                            } else {
                              const date = new Date();
                              date.setMonth(date.getMonth() + i + 1);
                              dates.push(date.toISOString().split('T')[0]);
                            }
                          }
                          setInstallmentDates(dates);
                        }}
                        className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-center text-lg font-bold"
                        placeholder="2"
                      />
                      <div className="flex gap-2 mt-2">
                        {[2, 3, 4, 6, 12].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              setInstallmentCount(count);
                              const dates: string[] = [];
                              for (let i = 0; i < count; i++) {
                                const date = new Date();
                                date.setMonth(date.getMonth() + i + 1);
                                dates.push(date.toISOString().split('T')[0]);
                              }
                              setInstallmentDates(dates);
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${installmentCount === count ? 'bg-purple-500 text-white' : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-100'
                              }`}
                          >
                            {count} oy
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bo'laklar jadvali - sanalarni o'zgartirish mumkin */}
                    {form.amountUzs && parseFloat(form.amountUzs) > 0 && installmentCount >= 2 && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-purple-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">To'lov jadvali (sanalarni o'zgartiring):</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {Array.from({ length: installmentCount }).map((_, i) => {
                            const totalAmount = parseFloat(form.amountUzs) || 0;
                            const perInstallment = Math.ceil(totalAmount / installmentCount);
                            const isLast = i === installmentCount - 1;
                            const thisAmount = isLast ? totalAmount - perInstallment * (installmentCount - 1) : perInstallment;

                            // Default sana
                            const defaultDate = new Date();
                            defaultDate.setMonth(defaultDate.getMonth() + i + 1);
                            const dateValue = installmentDates[i] || defaultDate.toISOString().split('T')[0];

                            return (
                              <div key={i} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                                <span className="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {i + 1}
                                </span>
                                <input
                                  type="date"
                                  value={dateValue}
                                  onChange={(e) => {
                                    const newDates = [...installmentDates];
                                    newDates[i] = e.target.value;
                                    setInstallmentDates(newDates);
                                  }}
                                  className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="font-bold text-purple-700 text-sm min-w-[100px] text-right">{thisAmount.toLocaleString()} {convertToLanguage("so'm", language)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-2 border-t border-purple-200 flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">{convertToLanguage('Jami', language)}:</span>
                          <span className="text-sm font-bold text-purple-700">{parseFloat(form.amountUzs).toLocaleString()} {convertToLanguage("so'm", language)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => {
                setShowAddModal(false);
                setNewCustomerMode(false);
                setCustomerSearch('');
                setForm({ customerId: '', amountUsd: '', amountUzs: '', dueDate: '', notes: '', initialPaymentUsd: '', initialPaymentUzs: '' });
                setGuarantorForm({ fullName: '', phone: '', address: '' });
                setShowGuarantorSection(false);
                setIsInstallment(false);
                setInstallmentCount(2);
                setInstallmentDates([]);
              }} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200">{convertToLanguage('Bekor', language)}</button>
              <button onClick={handleAddDebt} className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold">{convertToLanguage("Qo'shish", language)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add My Debt Modal (Payable) */}
      {showAddMyDebtModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-cyan-500 to-teal-600 sticky top-0">
              <h3 className="text-xl font-bold text-white">Mening qarzim</h3>
              <button onClick={() => {
                setShowAddMyDebtModal(false);
                setMyDebtForm({
                  creditorName: '',
                  creditorPhone: '',
                  amountUsd: '',
                  amountUzs: '',
                  dueDate: '',
                  notes: '',
                  type: 'supplier',
                  initialPaymentUsd: '',
                  initialPaymentUzs: ''
                });
              }} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qarz turi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'supplier', label: "Ta'minotchi", icon: Building },
                    { id: 'person', label: 'Shaxs', icon: User },
                    { id: 'other', label: 'Boshqa', icon: FileText },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setMyDebtForm({ ...myDebtForm, type: type.id as any })}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${myDebtForm.type === type.id ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <type.icon className={`w-5 h-5 ${myDebtForm.type === type.id ? 'text-cyan-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${myDebtForm.type === type.id ? 'text-cyan-600' : 'text-gray-600'}`}>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {myDebtForm.type === 'supplier' ? "Ta'minotchi nomi" : myDebtForm.type === 'person' ? 'Ism familiya' : 'Nomi'} *
                </label>
                <input type="text" value={myDebtForm.creditorName} onChange={(e) => setMyDebtForm({ ...myDebtForm, creditorName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="Kiriting..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                <input type="tel" value={myDebtForm.creditorPhone} onChange={(e) => setMyDebtForm({ ...myDebtForm, creditorPhone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="+998..." />
              </div>
              {/* Currency Rate */}
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Kurs: 1 $ =</span>
                  <span className="text-xs text-blue-500">(CBU)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(parseFloat(e.target.value) || 12500)}
                    className="w-28 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-700">UZS</span>
                  <button
                    type="button"
                    onClick={fetchExchangeRate}
                    disabled={rateLoading}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    title="CBU'dan yangilash"
                  >
                    <RefreshCw className={`w-4 h-4 ${rateLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qarz summasi *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input type="number" value={myDebtForm.amountUsd} onChange={(e) => handleAmountUsdChange(e.target.value, 'payable')} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 pr-14" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input type="number" value={myDebtForm.amountUzs} onChange={(e) => handleAmountUzsChange(e.target.value, 'payable')} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 pr-14" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              {/* Boshlang'ich to'lov - Men qarzdorman uchun */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <label className="text-sm font-semibold text-blue-700">
                    {convertToLanguage("Boshlang'ich to'lov (ixtiyoriy)", language)}
                  </label>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  {convertToLanguage("Qarz belgilanayotgan paytda darhol to'lanadigan summa", language)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={myDebtForm.initialPaymentUsd}
                      onChange={(e) => handleMyDebtInitialPaymentUsdChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={myDebtForm.initialPaymentUzs}
                      onChange={(e) => handleMyDebtInitialPaymentUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">UZS</span>
                  </div>
                </div>

                {/* Qoldiq qarzni ko'rsatish */}
                {(myDebtForm.amountUzs || myDebtForm.initialPaymentUzs) && (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{convertToLanguage(t('debts.totalDebtAmount'), language)}:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {(parseFloat(myDebtForm.amountUzs) || 0).toLocaleString()} {convertToLanguage("so'm", language)}
                        </span>
                      </div>
                      {myDebtForm.initialPaymentUzs && parseFloat(myDebtForm.initialPaymentUzs) > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-700">{convertToLanguage(t('debts.initialPayment'), language)}:</span>
                            <span className="text-sm font-bold text-blue-700">
                              -{(parseFloat(myDebtForm.initialPaymentUzs) || 0).toLocaleString()} {convertToLanguage("so'm", language)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                            <span className="text-sm font-semibold text-cyan-700">{convertToLanguage(t('debts.remainingDebt'), language)}:</span>
                            <span className="text-lg font-bold text-cyan-700">
                              {((parseFloat(myDebtForm.amountUzs) || 0) - (parseFloat(myDebtForm.initialPaymentUzs) || 0)).toLocaleString()} {convertToLanguage("so'm", language)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To'lov muddati</label>
                <SimpleDateInput 
                  value={myDebtForm.dueDate} 
                  onChange={(value) => setMyDebtForm({ ...myDebtForm, dueDate: value })} 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Izoh</label>
                <textarea value={myDebtForm.notes} onChange={(e) => setMyDebtForm({ ...myDebtForm, notes: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 resize-none" rows={2} placeholder="Qarz haqida..." />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3 sticky bottom-0">
              <button onClick={() => {
                setShowAddMyDebtModal(false);
                setMyDebtForm({
                  creditorName: '',
                  creditorPhone: '',
                  amountUsd: '',
                  amountUzs: '',
                  dueDate: '',
                  notes: '',
                  type: 'supplier',
                  initialPaymentUsd: '',
                  initialPaymentUzs: ''
                });
              }} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200">Bekor</button>
              <button onClick={handleAddMyDebt} className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold">Qo'shish</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay My Debt Modal (Payable) */}
      {showPayMyDebtModal && selectedMyDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-cyan-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">{convertToLanguage("Qarz to'lash", language)}</h3>
              <button onClick={() => setShowPayMyDebtModal(false)} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="font-semibold text-gray-900">{selectedMyDebt.creditorName}</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{formatMoney(selectedMyDebt.remainingAmount)} {convertToLanguage("so'm", language)}</p>
                <p className="text-sm text-gray-500">{convertToLanguage('Qoldiq qarz', language)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{convertToLanguage("To'lov summasi", language)}</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-cyan-500" placeholder="0" autoFocus />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPayAmount(Math.floor(selectedMyDebt.remainingAmount / 2).toString())} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200">50%</button>
                <button onClick={() => setPayAmount(selectedMyDebt.remainingAmount.toString())} className="flex-1 py-3 bg-cyan-100 text-cyan-700 rounded-xl text-sm font-semibold hover:bg-cyan-200">{convertToLanguage('Hammasi', language)}</button>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowPayMyDebtModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200">{convertToLanguage('Bekor', language)}</button>
              <button onClick={handlePayMyDebt} className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold">{convertToLanguage("To'lash", language)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Pay Modal (Qisman berish) */}
      {showPartialPayModal && selectedMyDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-orange-500 to-amber-600">
              <h3 className="text-xl font-bold text-white">{convertToLanguage(t('debts.partialPay'), language)}</h3>
              <button onClick={() => setShowPartialPayModal(false)} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-4">
                <p className="font-semibold text-gray-900">{selectedMyDebt.creditorName}</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{formatMoney(selectedMyDebt.remainingAmount)} {convertToLanguage("so'm", language)}</p>
                <p className="text-sm text-gray-500">{convertToLanguage('Qoldiq qarz', language)}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{convertToLanguage(t('debts.amountToGive'), language)} *</label>
                <input
                  type="number"
                  value={partialPayForm.amount}
                  onChange={(e) => setPartialPayForm({ ...partialPayForm, amount: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setPartialPayForm({ ...partialPayForm, amount: Math.floor(selectedMyDebt.remainingAmount / 4).toString() })}
                    className="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setPartialPayForm({ ...partialPayForm, amount: Math.floor(selectedMyDebt.remainingAmount / 2).toString() })}
                    className="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setPartialPayForm({ ...partialPayForm, amount: Math.floor(selectedMyDebt.remainingAmount * 0.75).toString() })}
                    className="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200"
                  >
                    75%
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{convertToLanguage(t('debts.recipientName'), language)} *</label>
                <input
                  type="text"
                  value={partialPayForm.recipientName}
                  onChange={(e) => setPartialPayForm({ ...partialPayForm, recipientName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500"
                  placeholder="Ism familiya..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{convertToLanguage(t('debts.recipientPhone'), language)}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+998</span>
                  <input
                    type="tel"
                    value={partialPayForm.recipientPhone.replace('+998', '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setPartialPayForm({ ...partialPayForm, recipientPhone: value ? `+998${value}` : '' });
                    }}
                    className="w-full pl-16 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500"
                    placeholder="XX XXX XX XX"
                    maxLength={9}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{convertToLanguage("Izoh", language)}</label>
                <textarea
                  value={partialPayForm.notes}
                  onChange={(e) => setPartialPayForm({ ...partialPayForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={2}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowPartialPayModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200"
              >
                {convertToLanguage('Bekor', language)}
              </button>
              <button
                onClick={handlePartialPayMyDebt}
                disabled={!partialPayForm.amount || !partialPayForm.recipientName}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {convertToLanguage("Berish", language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal - Menga qarzdor uchun */}
      {showCustomerDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div
              className={`p-6 flex justify-between items-center ${selectedCustomer.currentDebt === 0
                ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                : getCustomerStatus(selectedCustomer) === 'overdue'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-600'
                }`}
            >
              <div>
                <h3 className="text-xl font-bold text-white">{convertToLanguage(selectedCustomer.fullName, language)}</h3>
                {selectedCustomer.phone && (
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCustomerDetailModal(false);
                  setSelectedCustomer(null);
                }}
                className="p-2 hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Qarz ma'lumotlari */}
              <div className="p-6 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">{convertToLanguage('Jami qarz', language)}</p>
                    <p className="text-xl font-bold text-gray-900">{formatMoney(selectedCustomer.currentDebt)}</p>
                    <p className="text-xs text-gray-500">{convertToLanguage("so'm", language)}</p>
                  </div>
                  <div
                    className={`rounded-xl p-4 text-center ${selectedCustomer.currentDebt === 0
                      ? 'bg-emerald-50'
                      : getCustomerStatus(selectedCustomer) === 'overdue'
                        ? 'bg-red-50'
                        : 'bg-blue-50'
                      }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">{convertToLanguage('Holat', language)}</p>
                    {getStatusBadge(selectedCustomer)}
                  </div>
                </div>

                {/* To'lov muddati */}
                {selectedCustomer.debtDueDate && (
                  <div
                    className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${getCustomerStatus(selectedCustomer) === 'overdue'
                      ? 'bg-red-50 border border-red-200'
                      : getCustomerStatus(selectedCustomer) === 'today'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-blue-50 border border-blue-200'
                      }`}
                  >
                    <Calendar
                      className={`w-5 h-5 ${getCustomerStatus(selectedCustomer) === 'overdue'
                        ? 'text-red-500'
                        : getCustomerStatus(selectedCustomer) === 'today'
                          ? 'text-amber-500'
                          : 'text-blue-500'
                        }`}
                    />
                    <div>
                      <p className="text-xs text-gray-500">To'lov muddati</p>
                      <p
                        className={`font-semibold ${getCustomerStatus(selectedCustomer) === 'overdue'
                          ? 'text-red-700'
                          : getCustomerStatus(selectedCustomer) === 'today'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                          }`}
                      >
                        {formatDate(selectedCustomer.debtDueDate)}
                        {getCustomerStatus(selectedCustomer) === 'overdue' && (
                          <span className="ml-2 text-xs">({Math.abs(getDaysRemaining(selectedCustomer.debtDueDate) || 0)} {convertToLanguage("kun o'tgan", language)})</span>
                        )}
                        {getCustomerStatus(selectedCustomer) === 'today' && <span className="ml-2 text-xs">({convertToLanguage('Bugun', language)})</span>}
                        {getCustomerStatus(selectedCustomer) === 'pending' && getDaysRemaining(selectedCustomer.debtDueDate) && (
                          <span className="ml-2 text-xs">({getDaysRemaining(selectedCustomer.debtDueDate)} {convertToLanguage('kun qoldi', language)})</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Qarz qo'shilgan sana */}
                {selectedCustomer.createdAt && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{convertToLanguage("Qarz qo'shilgan", language)}: {formatDate(selectedCustomer.createdAt)}</span>
                  </div>
                )}
              </div>

              {/* Kafil ma'lumotlari - tarixdan olish */}
              {debtHistory.some((item) => item.guarantor?.fullName) && (
                <div className="p-6 border-b border-gray-100 bg-amber-50/50">
                  <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Kafil ma'lumotlari
                  </h4>
                  {debtHistory
                    .filter((item) => item.guarantor?.fullName)
                    .slice(0, 1)
                    .map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.guarantor.fullName}</p>
                            {item.guarantor.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {item.guarantor.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.guarantor.address && (
                          <p className="text-sm text-gray-600 pl-12">📍 {item.guarantor.address}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Bo'lib to'lash jadvali */}
              {debtHistory.some((item) => item.isInstallment && item.installments?.length > 0) && (
                <div className="p-6 border-b border-gray-100 bg-purple-50/50">
                  <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Bo'lib to'lash jadvali
                  </h4>
                  {debtHistory
                    .filter((item) => item.isInstallment && item.installments?.length > 0)
                    .slice(0, 1)
                    .map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        {item.installments.map((inst: any, instIdx: number) => (
                          <div
                            key={instIdx}
                            className={`flex items-center justify-between p-2 rounded-lg ${inst.isPaid ? 'bg-emerald-100' : new Date(inst.dueDate) < new Date() ? 'bg-red-100' : 'bg-white'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${inst.isPaid ? 'bg-emerald-500 text-white' : 'bg-purple-200 text-purple-700'
                                  }`}
                              >
                                {inst.isPaid ? '✓' : instIdx + 1}
                              </span>
                              <span className="text-sm text-gray-600">{formatDate(inst.dueDate)}</span>
                            </div>
                            <span className={`font-semibold ${inst.isPaid ? 'text-emerald-600 line-through' : 'text-purple-700'}`}>
                              {formatMoney(inst.amount)} {convertToLanguage("so'm", language)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}

              {/* To'lov qilish formasi */}
              {selectedCustomer.currentDebt > 0 && (
                <div className="p-6 border-b border-gray-100 bg-cyan-50/50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-600" />
                    {convertToLanguage("Qarz to'lash", language)}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{convertToLanguage("To'lov summasi", language)} *</label>
                      <input
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setPayAmount(Math.floor(selectedCustomer.currentDebt / 4).toString())}
                          className="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200"
                        >
                          25%
                        </button>
                        <button
                          onClick={() => setPayAmount(Math.floor(selectedCustomer.currentDebt / 2).toString())}
                          className="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200"
                        >
                          50%
                        </button>
                        <button
                          onClick={() => setPayAmount(Math.floor(selectedCustomer.currentDebt * 0.75).toString())}
                          className="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200"
                        >
                          75%
                        </button>
                        <button
                          onClick={() => setPayAmount(selectedCustomer.currentDebt.toString())}
                          className="flex-1 py-2 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-200"
                        >
                          100%
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kim oldi? (ixtiyoriy)</label>
                      <input
                        type="text"
                        value={payReceivedBy}
                        onChange={(e) => setPayReceivedBy(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Pulni kim qabul qildi..."
                      />
                    </div>
                    <button
                      onClick={handlePayDebt}
                      disabled={!payAmount || parseFloat(payAmount) <= 0}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      To'lovni tasdiqlash
                    </button>
                  </div>
                </div>
              )}

              {/* To'lovlar tarixi */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  To'lovlar tarixi
                </h4>

                {debtHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">Tarix topilmadi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {debtHistory.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border ${item.type === 'payment' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'payment' ? 'bg-emerald-500' : 'bg-red-500'
                                } text-white text-xs font-bold`}
                            >
                              {item.type === 'payment' ? '-' : '+'}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${item.type === 'payment' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {item.type === 'payment' ? convertToLanguage("To'lov", language) : convertToLanguage('Qarz', language)}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                            </div>
                          </div>
                          <p className={`text-sm font-bold ${item.type === 'payment' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.type === 'payment' ? '-' : '+'}
                            {formatMoney(item.amount)} {convertToLanguage("so'm", language)}
                          </p>
                        </div>
                        {item.receivedBy && <p className="text-xs text-gray-500 mt-2 pl-10">{convertToLanguage('Qabul qildi', language)}: {item.receivedBy}</p>}
                        {item.notes && <p className="text-xs text-gray-500 mt-1 pl-10">{item.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50">
              <button
                onClick={() => {
                  setShowCustomerDetailModal(false);
                  setSelectedCustomer(null);
                  setPayAmount('');
                  setPayReceivedBy('');
                }}
                className="w-full px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Debt Detail Modal - To'lovlar tarixi */}
      {showMyDebtDetailModal && selectedMyDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className={`p-6 flex justify-between items-center ${selectedMyDebt.remainingAmount === 0
              ? 'bg-gradient-to-r from-emerald-500 to-green-600'
              : 'bg-gradient-to-r from-orange-500 to-amber-600'
              }`}>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedMyDebt.creditorName}</h3>
                <p className="text-sm text-white/80">
                  {selectedMyDebt.type === 'supplier' ? "Ta'minotchi" :
                    selectedMyDebt.type === 'person' ? 'Shaxs' : 'Boshqa'}
                </p>
              </div>
              <button onClick={() => { setShowMyDebtDetailModal(false); setSelectedMyDebt(null); }} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Qarz ma'lumotlari */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{convertToLanguage('Jami qarz', language)}</p>
                  <p className="text-xl font-bold text-gray-900">{formatMoney(selectedMyDebt.amount)}</p>
                  <p className="text-xs text-gray-500">{convertToLanguage("so'm", language)}</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${selectedMyDebt.remainingAmount === 0 ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                  <p className="text-xs text-gray-500 mb-1">{convertToLanguage('Qoldiq', language)}</p>
                  <p className={`text-xl font-bold ${selectedMyDebt.remainingAmount === 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {formatMoney(selectedMyDebt.remainingAmount)}
                  </p>
                  <p className="text-xs text-gray-500">{convertToLanguage("so'm", language)}</p>
                </div>
              </div>

              {/* Progress bar */}
              {selectedMyDebt.amount > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{convertToLanguage("To'langan", language)}: {formatMoney(selectedMyDebt.paidAmount)} {convertToLanguage("so'm", language)}</span>
                    <span>{Math.round((selectedMyDebt.paidAmount / selectedMyDebt.amount) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${selectedMyDebt.remainingAmount === 0 ? 'bg-emerald-500' : 'bg-cyan-500'
                        }`}
                      style={{ width: `${Math.min(100, (selectedMyDebt.paidAmount / selectedMyDebt.amount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedMyDebt.dueDate && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>To'lov muddati: {formatDate(selectedMyDebt.dueDate)}</span>
                </div>
              )}

              {selectedMyDebt.creditorPhone && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{selectedMyDebt.creditorPhone}</span>
                </div>
              )}

              {selectedMyDebt.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Izoh:</p>
                  <p className="text-sm text-gray-700">{selectedMyDebt.notes}</p>
                </div>
              )}
            </div>

            {/* To'lovlar tarixi */}
            <div className="flex-1 overflow-auto p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                To'lovlar tarixi
              </h4>

              {(!selectedMyDebt.payments || selectedMyDebt.payments.length === 0) ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-sm">{convertToLanguage("Hali to'lov qilinmagan", language)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMyDebt.payments.map((payment, index) => (
                    <div key={payment._id} className={`flex items-center gap-3 p-3 rounded-xl border ${payment.type === 'partial' ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${payment.type === 'partial' ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}>
                        {payment.type === 'partial' ? '↗' : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${payment.type === 'partial' ? 'text-orange-700' : 'text-emerald-700'
                            }`}>
                            -{formatMoney(payment.amount)} {convertToLanguage("so'm", language)}
                          </p>
                          {payment.type === 'partial' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              {convertToLanguage(t('debts.partialPayment'), language)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.paidAt).toLocaleDateString('uz-UZ')} - {new Date(payment.paidAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {payment.recipientName && (
                          <p className="text-xs text-gray-600 mt-1">
                            👤 {payment.recipientName}
                            {payment.recipientPhone && ` • ${payment.recipientPhone}`}
                          </p>
                        )}
                        {payment.notes && payment.notes !== `Qisman to'lov - ${payment.recipientName}` && (
                          <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      {payment.type === 'partial' ? (
                        <ArrowUpRight className="w-5 h-5 text-orange-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => { setShowMyDebtDetailModal(false); setSelectedMyDebt(null); }}
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200"
              >
                Yopish
              </button>
              {selectedMyDebt.remainingAmount > 0 && (
                <>
                  <button
                    onClick={() => {
                      setShowMyDebtDetailModal(false);
                      setPartialPayForm({ amount: '', recipientName: '', recipientPhone: '', notes: '' });
                      setShowPartialPayModal(true);
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {convertToLanguage(t('debts.partialPay'), language)}
                  </button>
                  <button
                    onClick={() => { setShowMyDebtDetailModal(false); setPayAmount(''); setShowPayMyDebtModal(true); }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    To'lov qilish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-slate-700 to-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Qarz tarixi</h3>
                <p className="text-sm text-slate-300">{convertToLanguage(selectedCustomer.fullName, language)}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {debtHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tarix topilmadi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debtHistory.map((item, index) => (
                    <div key={index} className={`p-4 rounded-2xl border ${item.type === 'payment' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-semibold ${item.type === 'payment' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {item.type === 'payment' ? convertToLanguage("To'lov", language) : convertToLanguage("Qarz qo'shildi", language)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(item.createdAt)}</p>
                        </div>
                        <p className={`text-lg font-bold ${item.type === 'payment' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.type === 'payment' ? '-' : '+'}{formatMoney(item.amount)} {convertToLanguage("so'm", language)}
                        </p>
                      </div>
                      {item.notes && <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">{item.notes}</p>}

                      {/* Bo'lib to'lash ma'lumotlari */}
                      {item.isInstallment && item.installments && item.installments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 bg-purple-50 -mx-4 px-4 py-3">
                          <p className="text-xs font-semibold text-purple-700 mb-2">
                            {convertToLanguage("Bo'lib to'lash", language)} ({item.installmentCount} {convertToLanguage("bo'lak", language)}):
                          </p>
                          <div className="space-y-1.5">
                            {item.installments.map((inst: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-purple-100 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${inst.isPaid ? 'bg-emerald-500 text-white' : 'bg-purple-200 text-purple-700'
                                    }`}>
                                    {inst.isPaid ? '✓' : idx + 1}
                                  </span>
                                  <span className="text-gray-600">{new Date(inst.dueDate).toLocaleDateString('uz-UZ')}</span>
                                </div>
                                <span className={`font-semibold ${inst.isPaid ? 'text-emerald-600 line-through' : 'text-purple-700'}`}>
                                  {formatMoney(inst.amount)} {convertToLanguage("so'm", language)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kafil ma'lumotlari */}
                      {item.guarantor && item.guarantor.fullName && (
                        <div className={`mt-3 pt-3 border-t border-gray-200 bg-amber-50 -mx-4 ${item.isInstallment ? '' : '-mb-4'} px-4 py-3 ${item.isInstallment ? '' : 'rounded-b-2xl'}`}>
                          <p className="text-xs font-semibold text-amber-700 mb-1">{convertToLanguage('Kafil', language)}:</p>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-800">{item.guarantor.fullName}</span>
                          </div>
                          {item.guarantor.phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3 text-amber-600" />
                              <span className="text-xs text-gray-600">{item.guarantor.phone}</span>
                            </div>
                          )}
                          {item.guarantor.address && (
                            <p className="text-xs text-gray-600 mt-1 pl-6">{item.guarantor.address}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50">
              <button onClick={() => setShowHistoryModal(false)} className="w-full px-4 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200">{convertToLanguage('Yopish', language)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
