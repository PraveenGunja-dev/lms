
export const hasPermission = (allPermissions, departmentName, permissionType) => {
    
    if(!allPermissions || allPermissions.length < 1) return;
    
    const department = allPermissions.find(el => el.name === departmentName);

    if (department) {
        return department[permissionType] !== undefined ? department[permissionType] : false;
    }

    return false; 
}
