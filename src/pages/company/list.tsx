import { CreateButton, List } from "@refinedev/antd"
import { useGo } from "@refinedev/core";

export const CompanyList = () => {
  const go = useGo();

  return (
    <List
      breadcrumb={false}
      headerButtons={() => (
        <CreateButton />
      )}
    >

    </List>
  )
}