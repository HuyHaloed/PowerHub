import styles from "@/styles/doctor/ProfileCard.module.css";
import { useFetchDoctor } from "@/hooks/useFetchDoctor";
import { useLocation } from "react-router-dom";

const ProfileCard = () => {
    const location = useLocation();
    const doctorId = Number(location.pathname.split("/")[2]); // Chuyển đổi thành number
    const { data: doctor, isLoading } = useFetchDoctor(doctorId);

    if (isLoading) return <div>Loading...</div>;
    if (!doctor) return <div>Không tìm thấy thông tin bác sĩ.</div>;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <h2>Thông tin bác sĩ:</h2>
                <div className={styles.doctorInfo}>
                    <div className={styles.doctorDetails}>
                        <h3>{doctor.name}</h3>
                        <p><strong>Chuyên khoa:</strong> {doctor.specialty}</p>
                        <p><strong>Chuyên trị:</strong> {doctor.specializedTreatment}</p>
                        <p><strong>Lịch khám:</strong> {doctor.schedule}</p>
                    </div>
                </div>

                <h2>Giới thiệu</h2>
                <p>{doctor.description}</p>

                <h2>Phòng khám</h2>
                <p><strong>Bệnh viện:</strong> {doctor.hospital}</p>
                <p><strong>Phòng khám:</strong> {doctor.room}</p>
                <p><strong>Địa chỉ:</strong> {doctor.address}</p>
            </div>

            {/* <div className={styles.sidebar}>
                <h2>Dịch vụ:</h2>
                {doctor.services.length > 0 ? (
                    doctor.services.map((service, index) => (
                        <div key={index} className={styles.serviceBox}>{service}</div>
                    ))
                ) : (
                    <p>Không có dịch vụ nào.</p>
                )}

                <h2>Ngày khám:</h2>
                <select>
                    <option>Chọn ngày khám</option>
                    {doctor.availableDates.map((date, index) => (
                        <option key={index} value={date}>{date}</option>
                    ))}
                </select>

                <h2>Giờ khám:</h2>
                <div className={styles.timeSlots}>
                    {doctor.availableTimes.map((time, index) => (
                        <button key={index}>{time}</button>
                    ))}
                </div>

                <h2>Mô tả triệu chứng:</h2>
                <textarea placeholder="Mô tả..."></textarea>

                <button className={styles.nextButton}>Tiếp theo</button>
            </div> */}
        </div>
    );
};

export default ProfileCard;
