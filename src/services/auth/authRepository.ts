// src\services\auth\authRepository.ts
import { User } from "@/core/auth/authTypes"

const STORAGE_KEY = "sigma_users"

export function getUsers(): User[] {

  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) return []

  return JSON.parse(raw)

}

export function saveUsers(users: User[]) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users)
  )

}

export function findUser(username: string): User | undefined {

  const users = getUsers()

  return users.find(
    user => user.username === username
  )

}