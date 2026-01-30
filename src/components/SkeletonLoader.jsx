import './SkeletonLoader.css';

const SkeletonLoader = ({ type, count = 1 }) => {
    const items = Array.from({ length: count });

    return (
        <div className={`skeleton-container ${type}-skeleton`}>
            {items.map((_, i) => (
                <div key={i} className={`skeleton item ${type}`} />
            ))}
        </div>
    );
};

export default SkeletonLoader;
