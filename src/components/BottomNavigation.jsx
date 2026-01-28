import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, TrendingUp, Wallet, Users } from 'lucide-react';
import './BottomNavigation.css';

const BottomNavigation = () => {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                <LayoutDashboard size={24} />
                <span>Dashboard</span>
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Package size={24} />
                <span>Inventory</span>
            </NavLink>
            <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <TrendingUp size={24} />
                <span>Sales</span>
            </NavLink>
            <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Wallet size={24} />
                <span>Expenses</span>
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={24} />
                <span>Customers</span>
            </NavLink>
        </nav>
    );
};

export default BottomNavigation;
