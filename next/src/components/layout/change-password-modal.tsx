"use client";

import { App, Button, Input, Modal } from "antd";
import { useEffect, useState } from "react";

import { changePassword } from "@/services/api/account";
import { usePasswordDialogStore } from "@/stores/use-password-dialog-store";
import { useUserStore } from "@/stores/use-user-store";

const emptyValues = { oldPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordModal() {
    const { message } = App.useApp();
    const open = usePasswordDialogStore((state) => state.open);
    const closePasswordDialog = usePasswordDialogStore((state) => state.closePasswordDialog);
    const token = useUserStore((state) => state.token);
    const [values, setValues] = useState(emptyValues);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) setValues(emptyValues);
    }, [open]);

    const close = () => {
        if (loading) return;
        closePasswordDialog();
    };

    const submit = async () => {
        if (!token) {
            message.warning("请先登录");
            return;
        }
        if (!values.oldPassword || !values.newPassword || !values.confirmPassword) {
            message.warning("请完整填写密码");
            return;
        }
        if (values.newPassword.length < 6) {
            message.warning("新密码至少 6 位");
            return;
        }
        if (values.newPassword !== values.confirmPassword) {
            message.warning("两次输入的新密码不一致");
            return;
        }
        setLoading(true);
        try {
            await changePassword(token, { oldPassword: values.oldPassword, newPassword: values.newPassword });
            message.success("密码已修改，请妥善保管");
            closePasswordDialog();
        } catch (error) {
            message.error(error instanceof Error ? error.message : "修改密码失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="修改密码" open={open} onCancel={close} footer={<div className="flex justify-end gap-2"><Button onClick={close} disabled={loading}>取消</Button><Button type="primary" loading={loading} onClick={() => void submit()}>确认修改</Button></div>} destroyOnHidden>
            <div className="space-y-4 py-3">
                <Input.Password value={values.oldPassword} placeholder="当前密码" autoComplete="current-password" onChange={(event) => setValues((current) => ({ ...current, oldPassword: event.target.value }))} />
                <Input.Password value={values.newPassword} placeholder="新密码（至少 6 位）" autoComplete="new-password" onChange={(event) => setValues((current) => ({ ...current, newPassword: event.target.value }))} />
                <Input.Password value={values.confirmPassword} placeholder="确认新密码" autoComplete="new-password" onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </div>
        </Modal>
    );
}
