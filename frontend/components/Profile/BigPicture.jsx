export const BigPicture = ({ user, setOpenProfilePicture }) => {
  const handleStopPropagation = (e) => {
    e.stopPropagation();
  }
  return (
    <div className="big-picture" onClick={() => setOpenProfilePicture(false)}>
      <img src={`http://localhost:3000/api/user/profile/avatar/${user}`} alt="" onClick={(e) => handleStopPropagation(e)}/>
    </div>
  );
}